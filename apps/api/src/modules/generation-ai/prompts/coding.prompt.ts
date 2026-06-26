export const CODING_PROMPT_VERSION = "1.0.0";

export function generateCodingPrompt(
  topic: string,
  difficulty: string,
): string {
  return `Generate one coding/programming problem on ${topic}.

Difficulty: ${difficulty}.

Provide:
1. Question (description, constraint details, input/output requirements)
2. Correct Answer (reference code implementation or specific output)
3. Explanation (algorithmic logic and complexity analysis)

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
