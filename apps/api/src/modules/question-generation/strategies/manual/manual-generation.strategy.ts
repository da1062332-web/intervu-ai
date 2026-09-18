import { Injectable } from "@nestjs/common";
import { GenerationStrategy, Template } from "@prisma/client";
import { IQuestionGenerationStrategy } from "../../interfaces/generation-strategy.interface";
import { GenerationContext } from "../../interfaces/generation-context.interface";

@Injectable()
export class ManualGenerationStrategy implements IQuestionGenerationStrategy {
  async generate(template: Template): Promise<GenerationContext> {
    const config = (template.config as Record<string, any>) || {};
    const structure = (template.structure as Record<string, any>) || {};

    const questionText = config.questionText || structure.stem || template.name;
    const options = config.options || structure.options || [];

    return {
      strategy: ((GenerationStrategy as any).MANUAL || "MANUAL") as GenerationStrategy,
      payload: {
        questionText,
        options,
        questionMediaId: config.questionMediaId || null,
        questionMedia: config.questionMedia || null,
        richOptions: config.richOptions || [],
      },
      metadata: {
        isManual: true,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
