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
      filled = filled
        .replace("{{passage}}", payload.passage)
        .replace("{{topic}}", payload.datasetMetadata.topic)
        .replace("{{difficulty}}", payload.datasetMetadata.difficulty);
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

    return filled;
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
    // TODO: Replace with actual LLM service injection
    // Example: return this.aiService.generateQuestion(prompt);
    //
    // For now, return a structurally valid mock so the full pipeline
    // can be tested end-to-end without an LLM key.

    const strategyLabel =
      context.strategy === "VARIABLE"
        ? "Variable"
        : context.strategy === "DATASET"
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
}
