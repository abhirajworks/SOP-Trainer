import { NextRequest, NextResponse } from "next/server";
import { callGroqWithFallback, getCacheKey, getCachedResult, setCachedResult } from "@/lib/groq";

// In-memory rate limiter: max 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_SOP_LENGTH = 50_000; // ~50k chars (~12k tokens input safety cap)

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

const SYSTEM_PROMPT = `You are an AI training system that converts SOP documents into structured, practical training modules.

Follow this process internally:

STEP 1: Analyze the document
- Identify SOP type (process/policy/safety)
- Identify target audience (beginner/intermediate)
- Identify complexity level (low/medium/high)

IMPORTANT:
- If audience = beginner → simplify language and add more examples
- If complexity = high → include dependencies and edge cases
- If SOP type = compliance/safety → emphasize risks and consequences

STEP 2: Extract structured elements
- Core procedures (ordered steps)
- Decision points (if X → Y)
- Dependencies between steps
- Exceptions or edge cases
- Compliance-critical actions

STEP 3: Transform into training content
For each procedure:
- Create a learning objective
- Explain what to do
- Explain why it matters (real consequence)
- Provide a real-world example
- Add a common mistake
- Include prerequisite if applicable

OVERVIEW RULES (CRITICAL):
Write the overview as an executive summary:
- Start with what the SOP enables (NOT "this SOP outlines…")
- Identify the key stages of the process (2–4 phases)
- End with business impact (efficiency, compliance, risk reduction)
- Tone: direct, professional, no fluff, no generic phrases
BAD: "This SOP outlines..."
GOOD: "This training enables employees to execute onboarding across pre-joining setup, first-day integration, and early performance alignment, ensuring faster ramp-up, reduced compliance risk, and consistent employee experience."

STEP 4: Generate assessment
- 2 recall questions
- 2 scenario-based application questions
- 1 sequence question
- Each question must include explanation

You MUST respond with valid JSON only. No markdown, no code fences, no extra text. Use this exact structure:

{
  "analysis": {
    "sop_type": "",
    "audience": "",
    "complexity": ""
  },
  "overview": "",
  "training_modules": [
    {
      "learning_objective": "",
      "what_to_do": "",
      "why_it_matters": "",
      "example": "",
      "common_mistake": "",
      "prerequisite": ""
    }
  ],
  "decision_scenarios": [
    {
      "situation": "",
      "decision": "",
      "reasoning": ""
    }
  ],
  "quiz": [
    {
      "type": "",
      "question": "",
      "options": ["", "", "", ""],
      "answer": "",
      "explanation": ""
    }
  ]
}`;

const REVIEWER_SYSTEM_PROMPT = `You are an expert training content reviewer. Return VALID JSON only — no markdown, no code fences, no extra text outside the JSON object.`;

function buildReviewerUserMessage(rawJson: string): string {
  return `You are an expert training content reviewer.

You are given a JSON output from an SOP-to-training system.

Your job is to IMPROVE the quality of the content WITHOUT changing the JSON structure.

---

OBJECTIVE:
Refine the training content so it feels like real-world employee training, not generic AI output.

---

IMPROVEMENTS REQUIRED:

1. WHY_IT_MATTERS (CRITICAL)
- Replace generic phrases with real consequences
- Must include:
  - Operational impact (delays, inefficiency, customer experience)
  - AND real consequences (compliance risk, audit flags, revenue loss, escalation)

Example transformation:
BAD: "Ensures smooth processing"
GOOD: "Delays beyond SLA trigger compliance flags and increase customer churn, directly impacting retention and audit scores"

---
2. DECISION_SCENARIOS
- Make decisions precise and policy-based
- Add constraints (rules, eligibility, conditions)
- Improve reasoning:
  - Reference policy OR consequence
BAD: "Approve request"
GOOD: "Approve with partial refund as product is opened but within return window, per policy guidelines"

---
3. WHAT_TO_DO
- Make steps more actionable and specific
- Avoid vague instructions

---
4. LEARNING_OBJECTIVE
- Must be skill-based
- Start with action verbs (e.g., "Process", "Handle", "Validate", "Execute")

---
5. COMMON_MISTAKE
- Make realistic and specific
- Reflect actual employee errors

---
6. EXAMPLE
- Add real-world context:
  - time
  - situation
  - action
- Avoid generic examples

---
STRICT RULES:
- DO NOT change JSON structure
- DO NOT add new fields
- DO NOT remove fields
- DO NOT rename fields
- ONLY improve wording and clarity
- Keep output concise but sharp
- Return VALID JSON only (no text outside JSON)

---
INPUT JSON:
${rawJson}

---
OUTPUT:
Return improved JSON only.`;
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { sopText } = body;

    if (!sopText || typeof sopText !== "string" || sopText.trim().length < 20) {
      return NextResponse.json(
        { error: "Please provide a valid SOP document with at least 20 characters." },
        { status: 400 }
      );
    }

    if (sopText.length > MAX_SOP_LENGTH) {
      return NextResponse.json(
        { error: `SOP document is too large. Please keep it under ${MAX_SOP_LENGTH.toLocaleString()} characters.` },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    // Check cache first
    const cacheKey = getCacheKey(sopText);
    const cached = getCachedResult(cacheKey);
    if (cached) {
      console.log("[Cache] Returning cached SOP result");
      return NextResponse.json(cached);
    }

    // Call 1: Generate raw training content (with model fallback)
    const rawContent = await callGroqWithFallback({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { 
          role: "user", 
          content: `Analyze this SOP document and convert it into training modules. 
CRITICAL: ALL content must be extracted EXACTLY from the text below. DO NOT invent, guess, or hallucinate any modules, steps, or consequences.

SOP TEXT:
${sopText}` 
        },
      ],
      temperature: 0.1,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const rawParsed = JSON.parse(rawContent);

    if (!rawParsed.analysis || !rawParsed.overview || !rawParsed.training_modules) {
      return NextResponse.json(
        { error: "AI returned an incomplete response. Please try again." },
        { status: 500 }
      );
    }

    // Call 2: Refine and improve content quality (with model fallback)
    const refinedContent = await callGroqWithFallback({
      messages: [
        { role: "system", content: REVIEWER_SYSTEM_PROMPT },
        { role: "user", content: buildReviewerUserMessage(rawContent) },
      ],
      temperature: 0.1,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }).catch(() => null);

    if (!refinedContent) {
      // Fall back to raw output if reviewer fails
      setCachedResult(cacheKey, rawParsed);
      return NextResponse.json(rawParsed);
    }

    const refined = JSON.parse(refinedContent);

    // Ensure structure integrity — fall back to raw if reviewer broke it
    if (!refined.analysis || !refined.overview || !refined.training_modules) {
      setCachedResult(cacheKey, rawParsed);
      return NextResponse.json(rawParsed);
    }

    setCachedResult(cacheKey, refined);
    return NextResponse.json(refined);
  } catch (error: unknown) {
    console.error("SOP Processing Error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("SOP detail:", message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
