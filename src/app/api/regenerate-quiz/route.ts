import { NextRequest, NextResponse } from "next/server";
import { callGroqWithFallback } from "@/lib/groq";
import type { TrainingModule, QuizQuestion } from "@/types/sop";

const SYSTEM_PROMPT = `You are a training assessment generator. Return VALID JSON only — no markdown, no code fences, no extra text.`;

function buildUserMessage(modules: TrainingModule[], previousQuiz: QuizQuestion[]): string {
  const prevQuestions = previousQuiz.map((q) => q.question).join("\n- ");

  return `Generate a new set of quiz questions based on the training modules below.

Requirements:
- 2 recall questions
- 2 scenario-based application questions
- 1 sequence question
- Include explanations for each answer
- Avoid repeating these previous questions:
- ${prevQuestions}
- Focus on decision-making and real situations
- Each question must have exactly 4 options

Return JSON in this exact structure:
{
  "quiz": [
    {
      "type": "recall" | "scenario" | "sequence",
      "question": "",
      "options": ["", "", "", ""],
      "answer": "",
      "explanation": ""
    }
  ]
}

Training Modules:
${JSON.stringify(modules)}`;
}

export async function POST(request: NextRequest) {
  try {
    const { training_modules, previous_quiz } = await request.json();

    if (!training_modules || !Array.isArray(training_modules) || training_modules.length === 0) {
      return NextResponse.json(
        { error: "Training modules are required to generate quiz questions." },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const content = await callGroqWithFallback({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(training_modules, previous_quiz || []) },
      ],
      temperature: 0.6,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(content);

    if (!parsed.quiz || !Array.isArray(parsed.quiz)) {
      return NextResponse.json(
        { error: "AI returned an invalid quiz format. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ quiz: parsed.quiz });
  } catch (error: unknown) {
    console.error("Quiz Regeneration Error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
