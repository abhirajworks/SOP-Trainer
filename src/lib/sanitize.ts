/**
 * Strip common prompt-injection patterns from user input before sending to LLM.
 * Defense-in-depth measure — not foolproof, but raises the bar.
 */
export function sanitizeForLLM(text: string): string {
  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/gi,
    /you\s+are\s+now\s+(a|an)\s+/gi,
    /system\s*:\s*/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /<<\s*SYS\s*>>/gi,
    /<<\s*\/SYS\s*>>/gi,
  ];

  let cleaned = text;
  for (const pattern of injectionPatterns) {
    cleaned = cleaned.replace(pattern, "[filtered]");
  }

  return cleaned;
}
