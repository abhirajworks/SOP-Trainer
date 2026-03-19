import Groq from "groq-sdk";
import crypto from "crypto";

// --- Groq client (singleton) ---
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// --- Model fallback chain ---
// If the primary model is rate-limited, try the next one automatically
const MODEL_CHAIN = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
];

interface GroqChatParams {
  messages: { role: "system" | "user"; content: string }[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
}

/**
 * Calls Groq with automatic model fallback.
 * If a model returns a 429 (rate limit), it tries the next model in the chain.
 */
export async function callGroqWithFallback(params: GroqChatParams): Promise<string> {
  let lastError: unknown = null;

  for (const model of MODEL_CHAIN) {
    try {
      const completion = await groq.chat.completions.create({
        ...params,
        model,
      });
      const content = completion.choices[0]?.message?.content;
      if (content) {
        console.log(`[Groq] Success with model: ${model}`);
        return content;
      }
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      const message = err instanceof Error ? err.message : String(err);

      // Only fall through on rate limit (429); throw immediately on other errors
      if (status === 429) {
        console.warn(`[Groq] Rate limited on ${model}, trying next model...`);
        continue;
      }

      // Re-throw non-rate-limit errors
      throw new Error(`Groq API error (${model}): ${message}`);
    }
  }

  // All models exhausted
  const msg = lastError instanceof Error ? lastError.message : "All models rate-limited";
  throw new Error(`All Groq models are currently rate-limited. Please try again in a few minutes. (${msg})`);
}

// --- In-memory SOP result cache ---
// Keyed by a hash of the SOP text, stores the final JSON result
const sopCache = new Map<string, { result: unknown; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function getCacheKey(text: string): string {
  return crypto.createHash("sha256").update(text.trim().toLowerCase()).digest("hex").slice(0, 16);
}

export function getCachedResult(key: string): unknown | null {
  const entry = sopCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    sopCache.delete(key);
    return null;
  }
  return entry.result;
}

export function setCachedResult(key: string, result: unknown): void {
  // Keep cache small — evict oldest if over 100 entries
  if (sopCache.size > 100) {
    const oldest = sopCache.keys().next().value;
    if (oldest) sopCache.delete(oldest);
  }
  sopCache.set(key, { result, timestamp: Date.now() });
}
