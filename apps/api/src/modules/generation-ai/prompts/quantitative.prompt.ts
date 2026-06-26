export const QUANTITATIVE_PROMPT_VERSION = "1.0.0";

export function generateQuantitativePrompt(
  topic: string,
  difficulty: string,
): string {
  return `Generate one quantitative aptitude question on ${topic}.

Difficulty: ${difficulty}.

Provide:
1. Question (clear, concise, mathematical)
2. Correct Answer
3. Explanation (step-by-step math proof)

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
