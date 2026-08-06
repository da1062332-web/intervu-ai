import { Injectable } from "@nestjs/common";
import { evaluate } from "mathjs";
import { PreviewGenerationException } from "../../../core/exceptions";
import { PlaceholderValidatorService } from "../../template-library/services/placeholder-validator.service";
import {
  formatDisplayValue,
  formatInterpolatedDisplayValue,
} from "../utils/display-value-formatter";

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
  promptConfig?: {
    systemPrompt: string;
    userPrompt: string;
    instructions: string;
    outputRules?: string | null;
  };
  styleProfile?: any;
}

@Injectable()
export class PromptBuilderService {
  constructor(
    private readonly placeholderValidator: PlaceholderValidatorService = new PlaceholderValidatorService(),
  ) {}

  /**
   * Helper to replace variable placeholders with actual values
   */
  interpolate(text: string, variables: Record<string, any>): string {
    if (!text) return "";
    return text
      .replace(/\{\{([^{}]+)\}\}/g, (match, key, offset, text) => {
        const trimmed = key.trim();
        return variables.hasOwnProperty(trimmed)
          ? formatInterpolatedDisplayValue(text, offset, variables[trimmed])
          : match;
      })
      .replace(/\{([^{}]+)\}/g, (match, key, offset, text) => {
        const trimmed = key.trim();
        return variables.hasOwnProperty(trimmed)
          ? formatInterpolatedDisplayValue(text, offset, variables[trimmed])
          : match;
      });
  }

  /**
   * Dynamically constructs the prompt based on the template's strategy
   */
  buildPrompt(input: PromptBuilderInput): string {
    const strategy = input.template.generationStrategy || "VARIABLE";
    let prompt = "";

    switch (strategy.toUpperCase()) {
      case "VARIABLE":
        prompt = this.buildVariablePrompt(input);
        break;
      case "DATASET":
        prompt = this.buildDatasetPrompt(input);
        break;
      case "HYBRID":
        prompt = this.buildHybridPrompt(input);
        break;
      default:
        prompt = this.buildVariablePrompt(input);
        break;
    }

    if (input.styleProfile) {
      const difficulty = input.template.difficultyLevel || "medium";
      const styleInstructions = this.compileStyleProfileInstructions(
        input.styleProfile,
        difficulty,
      );
      prompt = `${prompt}\n\n${styleInstructions}`;
    }

    return prompt;
  }

  private buildVariablePrompt(input: PromptBuilderInput): string {
    const { template, variableValues } = input;
    const name = template.name || "Unnamed Template";
    const description = template.description || "No description provided.";
    const conceptKey = template.conceptKey;
    const difficulty = template.difficultyLevel.toLowerCase();
    const questionType = template.questionType;

    const rawQuestionTemplate =
      (template.structure &&
        (template.structure.questionTemplate ||
          template.structure.questionStatement ||
          template.structure.prompt)) ||
      "";

    const placeholderValidation = this.placeholderValidator.validate(
      rawQuestionTemplate,
      this.collectAllowedVariables(template, variableValues),
    );
    if (!placeholderValidation.valid) {
      throw new PreviewGenerationException(
        "Template configuration error.",
        {
          category: "PLACEHOLDER_ERROR",
          retryable: false,
          source: "prompt-builder",
          reason: `Unresolved placeholder(s) in question template: ${placeholderValidation.unknownVariables.join(", ")}`,
          context: {
            placeholders: placeholderValidation.unknownVariables,
            template: rawQuestionTemplate,
          },
        },
      );
    }

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
    const resolvedCorrectAnswer = this.resolveCorrectAnswer(template, variableValues);
    const correctAnswerVal =
      input.correctAnswer ||
      (variableValues as any).correctAnswer ||
      (variableValues as any).answer ||
      resolvedCorrectAnswer ||
      "";

    // Consider any supplied or computed correct answer as valid.
    const hasCorrectAnswer = String(correctAnswerVal).trim().length > 0;

    const correctAnswerHint = hasCorrectAnswer
      ? `- Correct Answer Value = ${correctAnswerVal}`
      : `- Correct Answer Value = [Compute the exact answer from the provided variables and return it in the JSON output]`;

    const variableValuesText = `
[RESOLVED PARAMETERS]
The math problem has already been solved by the backend. Use the following exact parameter values:
${Object.entries(variableValues)
  .map(([key, val]) => `- ${key} = ${formatDisplayValue(val)}`)
  .join("\n")}
${correctAnswerHint}

IMPORTANT: If the correct answer is not already supplied, compute it exactly from the provided parameter values. If a correct answer is supplied, verify that it matches the variables. Do not guess or invent an answer.
`;

    const questionInstructions = `
[QUESTION TEXT]
The pre-rendered question statement is:
"${interpolatedQuestion}"

Use this statement as the canonical question text. Do not change the mathematical operation, target, or the meaning of the question.
If you add any introductory context, keep it extremely brief and ensure the final question remains semantically equivalent to the original statement.
Do not rewrite the question into a different story that changes the problem being asked.
`;

    let optionStrategyText = "";
    if (questionType === "mcq" || questionType === "multiple_choice") {
      optionStrategyText = `
[OPTION STRATEGY]
You must generate exactly 4 options.
- 1 Option must match the correct answer value: "${correctAnswerVal}".
- 3 Options must be plausible distractors representing common calculation slipups or conceptual errors.
- Avoid obviously wrong options such as trivial negatives or nonsense values.
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
  "options": ["${correctAnswerVal}", "placeholder1", "placeholder2", "placeholder3"],
  "correctAnswer": "${correctAnswerVal}",
  "explanation": "Concept\\n\\nFormula / Reasoning\\n\\nStep-by-Step Solution\\n\\nFinal Answer",
  "difficulty": "${difficulty}",
  "metadata": {
    "concept": "${conceptKey}",
    "variables": ${JSON.stringify(variableValues)},
    "generationStrategy": "VARIABLE"
  }
}

CRITICAL: 
- The "options" array must contain ACTUAL VALUES (numbers, formulas, or strings), NOT labels like "Option A"
- The "correctAnswer" must be the EXACT VALUE from the options array that is correct
- Do NOT use "Option A", "Option B" as values - those are only labels for display purposes
- All 4 options must be distinct values
`;

    return `${systemPrompt}\n\n${templateContext}\n\n${variableValuesText}\n\n${questionInstructions}\n\n${optionStrategyText}\n\n${explanationRules}\n\n${outputFormat}`.trim();
  }

  private collectAllowedVariables(
    template: PromptBuilderInput["template"],
    variableValues: Record<string, unknown>,
  ): string[] {
    const allowed = new Set<string>(Object.keys(variableValues));

    const variableSchema = (template as any)?.variableSchema || {};
    const declaredVariables = Array.isArray(variableSchema.variables)
      ? variableSchema.variables
      : [];
    for (const variable of declaredVariables) {
      if (variable && typeof variable.name === "string") {
        allowed.add(variable.name);
      }
    }

    const generationStrategyConfig = variableSchema.generationStrategyConfig || {};
    const nestedVariables = Array.isArray(generationStrategyConfig.variables)
      ? generationStrategyConfig.variables
      : [];
    for (const variable of nestedVariables) {
      if (variable && typeof variable.name === "string") {
        allowed.add(variable.name);
      }
    }

    return Array.from(allowed);
  }

  private resolveCorrectAnswer(
    template: PromptBuilderInput["template"],
    variableValues: Record<string, unknown>,
  ): string | undefined {
    const solutionSchema = template.solutionSchema || {};

    if (
      solutionSchema.correctVariable &&
      variableValues.hasOwnProperty(solutionSchema.correctVariable)
    ) {
      return String(variableValues[solutionSchema.correctVariable as string]);
    }

    const finalAnswerExpression =
      solutionSchema.finalAnswer || solutionSchema.formula;
    if (typeof finalAnswerExpression === "string" && finalAnswerExpression.trim()) {
      try {
        const resolved = evaluate(finalAnswerExpression, variableValues as any);
        return resolved !== undefined ? String(resolved) : undefined;
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  private buildDatasetPrompt(input: PromptBuilderInput): string {
    const { template, promptConfig } = input;
    const name = template.name || "Unnamed Template";
    const description = template.description || "No description provided.";
    const conceptKey = template.conceptKey;
    const difficulty = template.difficultyLevel.toLowerCase();
    const questionType = template.questionType;

    const variableValues = {
      ...(input.variableValues || {}),
      ...(input.datasetItem?.metadata || {})
    };
    let datasetContent = input.datasetItem?.content || "";
    if (datasetContent) {
      datasetContent = this.interpolate(datasetContent, variableValues);
    }

    const systemPrompt = promptConfig?.systemPrompt || `You are an expert AI Assessment Question Generator. Your task is to generate assessment questions based on a provided static content asset.`;

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

    let parsedStructure: any = {};
    if (template.structure) {
      try {
        parsedStructure = typeof template.structure === "string" ? JSON.parse(template.structure) : template.structure;
      } catch (e) {}
    }

    let questionTemplateObj = parsedStructure?.questionTemplate;
    if (typeof questionTemplateObj === "string") {
      try {
        questionTemplateObj = JSON.parse(questionTemplateObj);
      } catch (e) {}
    }

    const generationPrompt = questionTemplateObj?.generationPrompt;
    const finalUserPrompt = generationPrompt || promptConfig?.userPrompt;

    let userPromptText = "";
    if (finalUserPrompt) {
      userPromptText = `
[USER PROMPT]
${this.interpolate(finalUserPrompt, { content: datasetContent, ...variableValues })}
`;
    }

    const questionStem = questionTemplateObj?.stem;
    const candidateInstructions = questionTemplateObj?.instructions;
    
    let presentationContext = "";
    if (questionStem || candidateInstructions) {
      presentationContext = `
[PRESENTATION CONTEXT]
The following text will be shown to the candidate. Your generated question should logically follow these instructions without repeating them:
${questionStem ? `Question Stem: "${questionStem}"` : ""}
${candidateInstructions ? `Candidate Instructions: "${candidateInstructions}"` : ""}
`;
    }

    let questionInstructions = promptConfig?.instructions || `
[QUESTION INSTRUCTIONS]
Generate a high-quality ${questionType} question of ${difficulty} difficulty that tests comprehension or analysis based on the content asset above.
- The question stem must refer directly to the content asset.
- Keep the wording precise, unambiguous, and suitable for the target age or proficiency level.
- Do not leak any variable placeholders (e.g. no curly braces).
`;
    if (promptConfig?.instructions) {
      questionInstructions = this.interpolate(promptConfig.instructions, variableValues);
    }

    let optionStrategyText = "";
    if (questionType === "mcq" || questionType === "multiple_choice") {
      optionStrategyText = `
[OPTION STRATEGY]
You must generate exactly 4 options:
- 1 Option must be the correct answer.
- 3 Options must be plausible distractors that represent realistic misinterpretations or grammatical errors.
- Avoid obviously wrong options and ensure all options are balanced in length and format.
`;
    }

    const explanationRules = `
[EXPLANATION RULES]
The explanation must follow this exact format:

Concept
<Summary of the concept being tested>

Formula / Reasoning
<The reasoning or rule applied to deduce the correct answer from the content>

Step-by-Step Solution
<A step-by-step breakdown explaining why the correct option is correct and why other options are incorrect based on the text>

Final Answer
<State the final answer clearly, explicitly referencing the correct option>
`;

    const customOutputRules = promptConfig?.outputRules ? `
[CUSTOM OUTPUT RULES]
${promptConfig.outputRules}
` : "";

    const outputFormat = `
[OUTPUT FORMAT]
Respond with a single JSON object without markdown blocks.
JSON Schema:
{
  "question": "The question text generated based on the content",
  "options": ["correctAnswerValue", "plausibleDistractor1", "plausibleDistractor2", "plausibleDistractor3"],
  "correctAnswer": "The exact value that matches one of the options in the array above",
  "explanation": "Concept\\n\\nFormula / Reasoning\\n\\nStep-by-Step Solution\\n\\nFinal Answer",
  "difficulty": "${difficulty}",
  "metadata": {
    "concept": "${conceptKey}",
    "generationStrategy": "DATASET",
    "datasetItem": ${JSON.stringify(input.datasetItem || {})}
  }
}

CRITICAL:
- The "options" array must contain ACTUAL VALUES (text, numbers, or concepts), NOT labels
- The "correctAnswer" must be the EXACT VALUE that appears in the options array
- Do NOT use "Option A", "Option B" as values - these are only for display labeling
- All 4 options must be distinct
`;

    return `${systemPrompt}\n\n${templateContext}\n\n${contentSection}\n\n${presentationContext}\n\n${userPromptText}\n\n${questionInstructions}\n\n${optionStrategyText}\n\n${explanationRules}\n\n${customOutputRules}\n\n${outputFormat}`.trim();
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
- Keep the puzzle concise and unambiguous while still requiring reasoning.
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
  "options": ["correctLogicalDeduction", "plausibleDistractor1", "plausibleDistractor2", "plausibleDistractor3"],
  "correctAnswer": "The exact value that matches one of the options in the array above",
  "explanation": "Concept\\n\\nFormula / Reasoning\\n\\nStep-by-Step Solution\\n\\nFinal Answer",
  "difficulty": "${difficulty}",
  "metadata": {
    "concept": "${conceptKey}",
    "generationStrategy": "HYBRID",
    "logicalGraph": ${JSON.stringify(graph)}
  }
}

CRITICAL:
- The "options" array must contain ACTUAL VALUES (text, logical conclusions), NOT labels
- The "correctAnswer" must be the EXACT VALUE that appears in the options array
- Do NOT use "Option A", "Option B" as values - these are only for display labeling
- All 4 options must be distinct logical conclusions
`;

    return `${systemPrompt}\n\n${templateContext}\n\n${graphSection}\n\n${questionInstructions}\n\n${optionStrategyText}\n\n${explanationRules}\n\n${outputFormat}`.trim();
  }

  private compileStyleProfileInstructions(
    styleProfile: any,
    difficulty: string,
  ): string {
    if (!styleProfile) return "";

    const language = styleProfile.languageStyle?.language || "English";
    const sentenceLength = styleProfile.languageStyle?.sentenceLength || "medium";
    const vocabularyLevel =
      styleProfile.languageStyle?.vocabularyLevel || "intermediate";
    const grammarStyle = styleProfile.languageStyle?.grammarStyle || "formal";

    const preferredContexts = styleProfile.contextStyle?.preferredContexts || [];
    const contextText =
      preferredContexts.length > 0
        ? `- Preferred Context: Prefer real-world contexts such as: ${preferredContexts.join(", ")}.`
        : "";

    const diffRules =
      styleProfile.difficultyStyle?.[difficulty.toLowerCase()] || [];
    const difficultyText =
      diffRules.length > 0
        ? `- Difficulty Wording Guidelines: ${diffRules.join(", ")}.`
        : "";

    const distractorRules = [];
    if (styleProfile.distractorRules?.exactlyFourOptions)
      distractorRules.push("exactly 4 options");
    if (styleProfile.distractorRules?.oneCorrectAnswer)
      distractorRules.push("exactly 1 correct answer (labeled A, B, C, or D)");
    if (styleProfile.distractorRules?.plausibleIncorrectOptions)
      distractorRules.push("plausible incorrect options");
    if (styleProfile.distractorRules?.avoidObviouslyWrongOptions)
      distractorRules.push("avoid obviously wrong options");
    if (styleProfile.distractorRules?.avoidHumorousOptions)
      distractorRules.push("avoid humorous options");
    if (styleProfile.distractorRules?.representCommonStudentMistakes)
      distractorRules.push(
        "distractors that represent common student mistakes",
      );
    const optionText =
      distractorRules.length > 0
        ? `- Option Rules: Options must have ${distractorRules.join(", ")}.`
        : "";

    const explanationRules = [];
    if (styleProfile.explanationStyle?.formulaFirst)
      explanationRules.push("start the explanation with the formula first");
    if (styleProfile.explanationStyle?.stepWiseSolution)
      explanationRules.push("show a step-wise solution");
    if (styleProfile.explanationStyle?.maxSteps)
      explanationRules.push(
        `limit explanation steps to at most ${styleProfile.explanationStyle.maxSteps}`,
      );
    if (styleProfile.explanationStyle?.explanationLength)
      explanationRules.push(
        `explanation length should be ${styleProfile.explanationStyle.explanationLength}`,
      );
    if (styleProfile.explanationStyle?.highlightFinalAnswer)
      explanationRules.push("highlight the final answer clearly");
    const explanationText =
      explanationRules.length > 0
        ? `- Explanation Rules: Explanations must ${explanationRules.join(", ")}.`
        : "";

    const aiInstructionsText = styleProfile.aiInstructions
      ? `- Additional System Rules: ${styleProfile.aiInstructions}`
      : "";

    return `
[STYLE PROFILE CONSTRAINTS]
- Language: ${language}
- Sentence Length: ${sentenceLength}
- Vocabulary Level: ${vocabularyLevel}
- Grammar Style: ${grammarStyle}
${contextText}
${difficultyText}
${optionText}
${explanationText}
${aiInstructionsText}
`.trim();
  }
}
