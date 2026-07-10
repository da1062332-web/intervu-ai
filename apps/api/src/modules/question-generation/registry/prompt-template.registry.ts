import { Injectable, NotFoundException } from "@nestjs/common";
import { GenerationStrategy } from "@prisma/client";

// Prompt template constants
export const VARIABLE_PROMPT_TEMPLATE = `You are an expert question generator for technical assessments.

Given the following resolved variables:
{{variables}}

And the question template:
{{hydratedQuestion}}

Generate a complete multiple-choice question with:
1. A clear, precise question text (using the provided variables)
2. Exactly 4 options labeled A, B, C, D
3. The correct answer (A/B/C/D)
4. A detailed explanation

Respond in JSON format:
{
  "questionText": "...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correctAnswer": "A",
  "explanation": "..."
}`;

export const DATASET_PROMPT_TEMPLATE = `You are an expert reading comprehension question generator.

Given the following passage:
{{passage}}

Topic: {{topic}}
Difficulty: {{difficulty}}

Generate a reading comprehension multiple-choice question with:
1. A clear question about the passage content
2. Exactly 4 options labeled A, B, C, D (only one correct, derivable from the passage)
3. The correct answer (A/B/C/D)
4. A brief explanation citing the passage

Respond in JSON format:
{
  "questionText": "...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correctAnswer": "A",
  "explanation": "..."
}`;

export const HYBRID_PROMPT_TEMPLATE = `You are an expert logical reasoning question generator.

Given the following relationship scenario:
Entities: {{entities}}
Relationships: {{relationships}}
Rules: {{rules}}

Generate a logical reasoning multiple-choice question with:
1. A scenario description followed by a clear question
2. Exactly 4 options labeled A, B, C, D
3. The correct answer (A/B/C/D) based on logical deduction
4. A step-by-step explanation of the reasoning

Respond in JSON format:
{
  "questionText": "...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correctAnswer": "A",
  "explanation": "..."
}`;

/**
 * PromptTemplateRegistry
 *
 * Holds a Map<GenerationStrategy, string> of prompt templates.
 * PromptBuilder obtains templates from this registry — no if/switch in the builder.
 */
@Injectable()
export class PromptTemplateRegistry {
  private readonly templates = new Map<GenerationStrategy, string>();

  register(key: GenerationStrategy, template: string): void {
    this.templates.set(key, template);
  }

  resolve(key: GenerationStrategy): string {
    const template = this.templates.get(key);
    if (!template) {
      throw new NotFoundException(`No prompt template registered for: ${key}`);
    }
    return template;
  }

  hasTemplate(key: GenerationStrategy): boolean {
    return this.templates.has(key);
  }
}
