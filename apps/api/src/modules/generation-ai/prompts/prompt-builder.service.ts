import { Injectable } from "@nestjs/common";

export interface PromptBuilderInput {
  template: {
    id: string;
    name: string;
    description?: string | null;
    conceptKey: string;
    difficultyLevel: string;
    questionType: string;
    structure: any;
    variableSchema: any;
    constraints: any;
    solutionSchema?: any;
  };
  variableValues: Record<string, unknown>;
}

@Injectable()
export class PromptBuilderService {
  /**
   * Dynamically constructs the full prompt package based on the Template Definition.
   */
  buildPrompt(input: PromptBuilderInput): string {
    const { template, variableValues } = input;

    const name = template.name || "Unnamed Template";
    const description = template.description || "No description provided.";
    const conceptKey = template.conceptKey;
    const difficulty = template.difficultyLevel.toLowerCase();
    const questionType = template.questionType;

    // 1. System Prompt Section
    const systemPrompt = `You are an expert AI Assessment Question Generator. Your task is to produce high-quality, professional, and mathematically/conceptually accurate assessment questions based on a structured template.`;

    // 2. Template Context Section
    const templateContext = `
[TEMPLATE CONTEXT]
- Template Name: ${name}
- Template Description: ${description}
- Concept Area: ${conceptKey}
- Difficulty Level: ${difficulty.toUpperCase()}
- Question Type: ${questionType.toUpperCase()}
`;

    // 3. Variable Values Section
    const variableValuesText = `
[VARIABLE VALUES]
Use the following exact values for the template variables in the question:
${Object.entries(variableValues)
  .map(([key, val]) => `- ${key} = ${val}`)
  .join("\n")}
`;

    // 4. Question Instructions Section
    const rawQuestionTemplate =
      (template.structure && template.structure.questionTemplate) || "";
    const questionInstructions = `
[QUESTION STRUCTURE]
You must formulate the question based on this structural pattern:
"${rawQuestionTemplate}"

Inject the provided variable values directly into the corresponding placeholders. Do not leak raw curly braces or placeholder tokens in the final question text.
`;

    // 5. Option Strategy Section
    let optionStrategyText = "";
    if (questionType === "mcq" || questionType === "multiple_choice") {
      optionStrategyText = `
[OPTION STRATEGY]
You must generate exactly 4 options.
- 1 Option must be the correct answer.
- 3 Options must be plausible distractors that are context-relevant and represent common conceptual/mathematical misconceptions.
- Do not generate duplicate options.
- All options must have consistent formatting (e.g. units, casing, number of decimal places).
`;
    } else {
      optionStrategyText = `
[OPTION STRATEGY]
Since this is a ${questionType} question type, return an empty array for options.
`;
    }

    // 6. Solution Logic & Explanation Rules
    const solutionSteps =
      (template.solutionSchema && template.solutionSchema.steps) || [];

    const explanationRules = `
[EXPLANATION RULES]
You must provide a clear step-by-step explanation. The explanation must adhere to the following exact structure:

Concept
<Brief summary of the concept used in the question>

Formula / Reasoning
<Detail of the formula, rule, or logical reasoning applied>

Step-by-Step Solution
<Detailed, step-by-step layout of how the solution is solved using the supplied variable values. Relate it to the template steps:
${solutionSteps.map((step: string, idx: number) => `Step ${idx + 1}: ${step}`).join("\n")}
>

Final Answer
<State the final answer clearly>
`;

    // 7. Output Format Section
    const outputFormat = `
[OUTPUT FORMAT]
You MUST respond with a single JSON object. Do not wrap the JSON in markdown blocks (e.g., do not use \`\`\`json). The output must be raw JSON.
JSON Schema:
{
  "question": "The final question text with variable values injected",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "The exact correct answer (must match one of the options)",
  "explanation": "Concept\\n\\nFormula / Reasoning\\n\\nStep-by-Step Solution\\n\\nFinal Answer",
  "difficulty": "${difficulty}",
  "metadata": {
    "concept": "${conceptKey}",
    "variables": ${JSON.stringify(variableValues)}
  }
}
`;

    // Combine sections
    return `${systemPrompt}

${templateContext}

${variableValuesText}

${questionInstructions}

${optionStrategyText}

${explanationRules}

${outputFormat}
`.trim();
  }
}
