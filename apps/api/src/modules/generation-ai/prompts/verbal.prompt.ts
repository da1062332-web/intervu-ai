export const VERBAL_PROMPT_VERSION = "1.0.0";

export function generateVerbalPrompt(
  topic: string,
  difficulty: string,
): string {
  return `Generate one verbal ability and comprehension question on ${topic}.

Difficulty: ${difficulty}.

Provide:
1. Question (sentence, passage, or vocabulary statement)
2. Correct Answer
3. Explanation (grammatical or contextual reasoning)

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
