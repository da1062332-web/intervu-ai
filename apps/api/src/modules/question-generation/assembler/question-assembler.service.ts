import { Injectable } from "@nestjs/common";
import { GenerationContext } from "../interfaces/generation-context.interface";
import { RawQuestion } from "../interfaces/validation-strategy.interface";

export interface AssembledQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  topicId?: string;
  sectionId?: string;
  source: "GENERATED";
  templateId: string;
  generationStrategy: string;
  metadata: {
    strategy: string;
    contextSummary: string;
    generatedAt: string;
    [key: string]: unknown;
  };
}

/**
 * QuestionAssembler
 *
 * Assembles the unified Question object from GenerationContext + RawQuestion.
 * Does NOT persist — delegates persistence to QuestionRepository.
 * Strategy-agnostic: assembles the same shape regardless of which strategy
 * produced the context.
 */
@Injectable()
export class QuestionAssemblerService {
  assemble(
    context: GenerationContext,
    rawQuestion: RawQuestion,
    templateId: string,
    topicId?: string,
    sectionId?: string,
  ): AssembledQuestion {
    const metadata = context.metadata as Record<string, unknown>;

    return {
      questionText: rawQuestion.questionText,
      options: rawQuestion.options,
      correctAnswer: rawQuestion.correctAnswer,
      explanation: rawQuestion.explanation,
      difficulty: (metadata.difficulty as string) ?? "MEDIUM",
      topicId,
      sectionId,
      source: "GENERATED",
      templateId,
      generationStrategy: context.strategy,
      metadata: {
        strategy: context.strategy,
        contextSummary: this.buildContextSummary(context),
        generatedAt:
          (metadata.generatedAt as string) ?? new Date().toISOString(),
        ...metadata,
      },
    };
  }

  private buildContextSummary(context: GenerationContext): string {
    const meta = context.metadata as Record<string, unknown>;
    if (context.strategy === "VARIABLE") {
      return `Variable strategy — template: ${meta.templateKey ?? meta.templateId}`;
    } else if (context.strategy === "DATASET") {
      return `Dataset strategy — dataset: ${meta.datasetName}, type: ${meta.datasetType}`;
    } else {
      return `Hybrid strategy — scenario: ${meta.scenarioName ?? meta.scenarioId}, entities: ${meta.entityCount}`;
    }
  }
}
