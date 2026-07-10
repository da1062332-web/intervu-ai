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
    generationStrategy?: string;
  };
  variableValues: Record<string, unknown>;
  correctAnswer?: string;
  datasetItem?: {
    content: string;
    metadata?: Record<string, any>;
  };
  logicalGraph?: {
    entities: string[];
    relations: { source: string; target: string; type: string }[];
  };
}

@Injectable()
export class PromptBuilderService {
  /**
   * Helper to replace variable placeholders with actual values
   */
  interpolate(text: string, variables: Record<string, any>): string {
    if (!text) return "";
    return text
      .replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
        const trimmed = key.trim();
        return variables.hasOwnProperty(trimmed) ? String(variables[trimmed]) : match;
      })
      .replace(/\{([^{}]+)\}/g, (match, key) => {
        const trimmed = key.trim();
        return variables.hasOwnProperty(trimmed) ? String(variables[trimmed]) : match;
      });
  }

  /**
   * Dynamically constructs the prompt based on the template's strategy
   */
  buildPrompt(input: PromptBuilderInput): string {
    const strategy = input.template.generationStrategy || "VARIABLE";

    switch (strategy.toUpperCase()) {
      case "VARIABLE":
        return this.buildVariablePrompt(input);
      case "DATASET":
        return this.buildDatasetPrompt(input);
      case "HYBRID":
        return this.buildHybridPrompt(input);
      default:
        return this.buildVariablePrompt(input);
    }
  }

  private buildVariablePrompt(input: PromptBuilderInput): string {
    const { template, variableValues } = input;
    const name = template.name || "Unnamed Template";
    const description = template.description || "No description provided.";
    const conceptKey = template.conceptKey;
    const difficulty = template.difficultyLevel.toLowerCase();
    const questionType = template.questionType;

    const rawQuestionTemplate = (template.structure && template.structure.questionTemplate) || "";
    // Pre-interpolate question stem using direct variable substitution
    const interpolatedQuestion = this.interpolate(rawQuestionTemplate, variableValues);

    const systemPrompt = `You are an expert AI Assessment Question Generator. Your task is to produce high-quality, professional, and mathematically accurate assessment questions based on solved numerical parameters.`;

    const templateContext = `
[TEMPLATE CONTEXT]
- Template Name: ${name}
- Template Description: ${description}
- Concept Area: ${conceptKey}
- Difficulty Level: ${difficulty.toUpperCase()}
- Question Type: ${questionType.toUpperCase()}
- Generation Strategy: VARIABLE
`;

    // Try to get pre-calculated correctAnswer
    const correctAnswerVal = input.correctAnswer || variableValues.correctAnswer || (variableValues as any).answer || "";

    const variableValuesText = `
[RESOLVED PARAMETERS]
The math problem has already been solved by the backend. Use the following exact parameter values:
${Object.entries(variableValues)
  .map(([key, val]) => `- ${key} = ${val}`)
  .join("\n")}
- Correct Answer Value = ${correctAnswerVal}

IMPORTANT: Do not perform any mathematical calculations. The correct answer has been computed as: "${correctAnswerVal}". You must structure your options and explanation around this exact answer.
`;

    const questionInstructions = `
[QUESTION TEXT]
The pre-rendered question statement is:
"${interpolatedQuestion}"

You must output this exact question stem in the "question" field. Do not modify the variables or wording of this statement. Do not leak raw curly braces or placeholder tokens.
`;

    let optionStrategyText = "";
    if (questionType === "mcq" || questionType === "multiple_choice") {
      optionStrategyText = `
[OPTION STRATEGY]
You must generate exactly 4 options.
- 1 Option must match the correct answer value: "${correctAnswerVal}".
- 3 Options must be plausible distractors representing common calculation slipups or conceptual errors.
- Do not generate duplicate options.
- All options must be of balanced characters and similar lengths.
`;
    } else {
      optionStrategyText = `
[OPTION STRATEGY]
Since this is a ${questionType} question type, return an empty array for options.
`;
    }

    const solutionSteps = (template.solutionSchema && template.solutionSchema.steps) || [];
    const explanationRules = `
[EXPLANATION RULES]
Write a step-by-step math explanation. The explanation must adhere to the following exact structure with exactly these headings:

Concept
<Brief summary of the concept used in the question>

Formula / Reasoning
<Detail of the formula or mathematical rule applied>

Step-by-Step Solution
<Show the step-by-step layout of how the solution is solved using the supplied values. Emphasize:
${solutionSteps.map((step: string, idx: number) => `Step ${idx + 1}: ${step}`).join("\n")}
>

Final Answer
<State the final answer clearly, explicitly referencing the correct option: "${correctAnswerVal}">
`;

    const outputFormat = `
[OUTPUT FORMAT]
You MUST respond with a single JSON object. Do not wrap the JSON in markdown blocks.
JSON Schema:
{
  "question": "${interpolatedQuestion}",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "${correctAnswerVal}",
  "explanation": "Concept\\n\\nFormula / Reasoning\\n\\nStep-by-Step Solution\\n\\nFinal Answer",
  "difficulty": "${difficulty}",
  "metadata": {
    "concept": "${conceptKey}",
    "variables": ${JSON.stringify(variableValues)},
    "generationStrategy": "VARIABLE"
  }
}
`;

    return `${systemPrompt}\n\n${templateContext}\n\n${variableValuesText}\n\n${questionInstructions}\n\n${optionStrategyText}\n\n${explanationRules}\n\n${outputFormat}`.trim();
  }

  private buildDatasetPrompt(input: PromptBuilderInput): string {
    const { template } = input;
    const name = template.name || "Unnamed Template";
    const description = template.description || "No description provided.";
    const conceptKey = template.conceptKey;
    const difficulty = template.difficultyLevel.toLowerCase();
    const questionType = template.questionType;

    const datasetContent = input.datasetItem?.content || "";

    const systemPrompt = `You are an expert AI Assessment Question Generator. Your task is to generate verbal, grammar, or reading comprehension questions based on a provided static content asset.`;

    const templateContext = `
[TEMPLATE CONTEXT]
- Template Name: ${name}
- Template Description: ${description}
- Concept Area: ${conceptKey}
- Difficulty Level: ${difficulty.toUpperCase()}
- Question Type: ${questionType.toUpperCase()}
- Generation Strategy: DATASET
`;

    const contentSection = `
[CONTENT ASSET]
Use the following content block as the source material for the question:
"""
${datasetContent}
"""
`;

    const questionInstructions = `
[QUESTION INSTRUCTIONS]
Generate a high-quality ${questionType} question of ${difficulty} difficulty that tests comprehension, syntax, or vocabulary based on the content asset above.
- The question stem must refer directly to the content asset.
- Do not leak any variable placeholders (e.g. no curly braces).
`;

    let optionStrategyText = "";
    if (questionType === "mcq" || questionType === "multiple_choice") {
      optionStrategyText = `
[OPTION STRATEGY]
You must generate exactly 4 options:
- 1 Option must be the correct answer.
- 3 Options must be plausible distractors that represent realistic misinterpretations or grammatical errors.
- Ensure all options are balanced in length and format.
`;
    }

    const explanationRules = `
[EXPLANATION RULES]
The explanation must follow this exact format:

Concept
<Summary of the grammar, lexical, or verbal concept being tested>

Formula / Reasoning
<The reasoning or rule applied to deduce the correct answer from the content>

Step-by-Step Solution
<A step-by-step breakdown explaining why the correct option is correct and why other options are incorrect based on the text>

Final Answer
<State the final answer clearly, explicitly referencing the correct option>
`;

    const outputFormat = `
[OUTPUT FORMAT]
Respond with a single JSON object without markdown blocks.
JSON Schema:
{
  "question": "The question text generated based on the content",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "The correct answer value",
  "explanation": "Concept\\n\\nFormula / Reasoning\\n\\nStep-by-Step Solution\\n\\nFinal Answer",
  "difficulty": "${difficulty}",
  "metadata": {
    "concept": "${conceptKey}",
    "generationStrategy": "DATASET",
    "datasetItem": ${JSON.stringify(input.datasetItem || {})}
  }
}
`;

    return `${systemPrompt}\n\n${templateContext}\n\n${contentSection}\n\n${questionInstructions}\n\n${optionStrategyText}\n\n${explanationRules}\n\n${outputFormat}`.trim();
  }

  private buildHybridPrompt(input: PromptBuilderInput): string {
    const { template } = input;
    const name = template.name || "Unnamed Template";
    const description = template.description || "No description provided.";
    const conceptKey = template.conceptKey;
    const difficulty = template.difficultyLevel.toLowerCase();
    const questionType = template.questionType;

    const graph = input.logicalGraph || { entities: [], relations: [] };

    const systemPrompt = `You are an expert AI Assessment Question Generator. Your task is to translate a structured logical relationship graph into a natural-language logical reasoning puzzle.`;

    const templateContext = `
[TEMPLATE CONTEXT]
- Template Name: ${name}
- Template Description: ${description}
- Concept Area: ${conceptKey}
- Difficulty Level: ${difficulty.toUpperCase()}
- Question Type: ${questionType.toUpperCase()}
- Generation Strategy: HYBRID
`;

    const graphSection = `
[RELATIONSHIP GRAPH]
Translate the following entities and relations into a story or word puzzle:
- Entities: ${graph.entities.join(", ")}
- Relations:
${graph.relations.map((r) => `  * ${r.source} is the ${r.type} of ${r.target}`).join("\n")}
`;

    const questionInstructions = `
[QUESTION INSTRUCTIONS]
- Write a natural language puzzle incorporating all entities and relations from the logic graph.
- The puzzle statement must reference all the specified entities: ${graph.entities.join(", ")}.
- Do not introduce relations that contradict or alter the graph.
- Create a question asking the candidate to deduce a specific relation or arrangement.
`;

    let optionStrategyText = "";
    if (questionType === "mcq" || questionType === "multiple_choice") {
      optionStrategyText = `
[OPTION STRATEGY]
Generate exactly 4 options:
- 1 Option must be the correct logical deduction.
- 3 Options must be plausible distractors representing typical logical reasoning errors.
`;
    }

    const explanationRules = `
[EXPLANATION RULES]
The explanation must follow this exact format:

Concept
<The logical reasoning domain, e.g. blood relation, seating order>

Formula / Reasoning
<The logical rules or deduction patterns applied>

Step-by-Step Solution
<Show the step-by-step chain of deductions mapping from the puzzle text back to the relations to prove the answer>

Final Answer
<State the final answer clearly, explicitly referencing the correct option>
`;

    const outputFormat = `
[OUTPUT FORMAT]
Respond with a single JSON object without markdown blocks.
JSON Schema:
{
  "question": "The natural language word puzzle and question",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "The correct option value",
  "explanation": "Concept\\n\\nFormula / Reasoning\\n\\nStep-by-Step Solution\\n\\nFinal Answer",
  "difficulty": "${difficulty}",
  "metadata": {
    "concept": "${conceptKey}",
    "generationStrategy": "HYBRID",
    "logicalGraph": ${JSON.stringify(graph)}
  }
}
`;

    return `${systemPrompt}\n\n${templateContext}\n\n${graphSection}\n\n${questionInstructions}\n\n${optionStrategyText}\n\n${explanationRules}\n\n${outputFormat}`.trim();
  }
}
