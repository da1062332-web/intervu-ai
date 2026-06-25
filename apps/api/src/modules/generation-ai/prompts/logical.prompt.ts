export const LOGICAL_PROMPT_VERSION = "1.0.0";

export function generateLogicalPrompt(
  topic: string,
  difficulty: string,
): string {
  return `Generate one logical reasoning question on ${topic}.

Difficulty: ${difficulty}.

Provide:
1. Question (clear logical scenario or puzzle)
2. Correct Answer
3. Explanation (deductive logic breakdown)

Return JSON only.
Ensure there are no leading or trailing markdowns (like \`\`\`json). The output must be raw JSON parsable.

Format:
{
  "question": "question text",
  "answer": "correct answer",
  "explanation": "explanation text",
  "difficulty": "${difficulty}",
  "topic": "${topic}"
}`;
}
