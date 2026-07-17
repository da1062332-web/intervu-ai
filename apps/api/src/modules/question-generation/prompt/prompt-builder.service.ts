import { Injectable } from "@nestjs/common";
import { PromptTemplateRegistry } from "../registry/prompt-template.registry";
import {
  GenerationContext,
  VariablePayload,
  DatasetPayload,
  HybridPayload,
} from "../interfaces/generation-context.interface";
import { RawQuestion } from "../interfaces/validation-strategy.interface";

/**
 * PromptBuilder
 *
 * Obtains the prompt template from PromptTemplateRegistry (no if/switch),
 * fills it with GenerationContext.payload fields, and calls the LLM.
 */
@Injectable()
export class PromptBuilderService {
  constructor(
    private readonly promptTemplateRegistry: PromptTemplateRegistry,
  ) {}

  async buildAndExecute(context: GenerationContext): Promise<RawQuestion> {
    // 1. Obtain prompt template from registry — no switch, no if
    const promptTemplate = this.promptTemplateRegistry.resolve(context.strategy);

    // 2. Fill template with payload data
    const filledPrompt = this.fillTemplate(promptTemplate, context);

    // 3. Call LLM — returns raw question
    return this.callLLM(filledPrompt, context);
  }

  private fillTemplate(template: string, context: GenerationContext): string {
    let filled = template;

    if (context.strategy === "VARIABLE") {
      const payload = context.payload as VariablePayload;
      filled = filled
        .replace(
          "{{variables}}",
          JSON.stringify(payload.variables, null, 2),
        )
        .replace("{{hydratedQuestion}}", payload.hydratedQuestion ?? "");
    } else if (context.strategy === "DATASET") {
      const payload = context.payload as DatasetPayload;
      const variables = (context.metadata?.variables as Record<string, any>) || {};
      filled = filled
        .replace("{{passage}}", payload.passage)
        .replace("{{topic}}", payload.datasetMetadata.topic)
        .replace("{{difficulty}}", payload.datasetMetadata.difficulty);
      filled = this.interpolate(filled, { ...variables, passage: payload.passage });
    } else if (context.strategy === "HYBRID") {
      const payload = context.payload as HybridPayload;
      const graph = payload.relationshipGraph;
      filled = filled
        .replace(
          "{{entities}}",
          JSON.stringify(graph.entities ?? [], null, 2),
        )
        .replace(
          "{{relationships}}",
          JSON.stringify(graph.edges ?? [], null, 2),
        )
        .replace(
          "{{rules}}",
          JSON.stringify(
            payload.scenario.entitySchema.rules ?? {},
            null,
            2,
          ),
        );
    }

    const difficulty = (context.metadata?.difficulty as string) || "medium";
    const styleProfile = context.metadata?.styleProfile;
    if (styleProfile) {
      const styleInstructions = this.compileStyleProfileInstructions(
        styleProfile,
        difficulty,
      );
      filled = `${filled}\n\n${styleInstructions}`;
    }

    return filled;
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

  /**
   * LLM integration point.
   *
   * Currently returns a structured mock response that follows the expected shape.
   * Replace with actual LLM call (OpenAI, Gemini, etc.) once the AI service
   * is injected. The mock is deterministic enough for Sprint 1 validation.
   */
  private async callLLM(
    prompt: string,
    context: GenerationContext,
  ): Promise<RawQuestion> {
    if (context.strategy === "VARIABLE") {
      const payload = context.payload as VariablePayload;
      const a = Number(payload.variables.a ?? 0);
      const b = Number(payload.variables.b ?? 0);
      const ans = Math.round((a / 100) * b);
      
      return {
        questionText: payload.hydratedQuestion ?? "",
        options: [
          `A. ${ans}`,
          `B. ${ans + 50}`,
          `C. ${ans - 25}`,
          `D. ${ans * 2}`,
        ],
        correctAnswer: "A",
        explanation: `To find ${a}% of ${b}, compute (${a} / 100) * ${b} = ${ans}.`,
      };
    }

    const strategyLabel =
      context.strategy === "DATASET"
        ? "Reading Comprehension"
        : "Logical Reasoning";

    return {
      questionText: `[${strategyLabel}] Mock question generated from template ${(context.metadata as any).templateId ?? "unknown"}.`,
      options: [
        "A. First option",
        "B. Second option",
        "C. Third option (correct)",
        "D. Fourth option",
      ],
      correctAnswer: "C",
      explanation: `This is a mock explanation for the ${strategyLabel} strategy. Replace with actual LLM output.`,
    };
  }

  private interpolate(text: string, variables: Record<string, any>): string {
    if (!text) return "";
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const strValue = typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
      result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), strValue);
    }
    return result;
  }
}
