import {
  AIResponseSchema,
  AIResponse,
  LegacyGenerationRequest,
} from "@intervu-ai/contracts";
import { AppLogger } from "@intervu-ai/shared-logger";

export class AiWorkerService {
  constructor(private readonly logger: AppLogger) {}

  async generateQuestions(
    request: LegacyGenerationRequest,
    correlationId: string,
  ): Promise<AIResponse> {
    this.logger.info(`Starting AI generation for topic: ${request.topic}`, {
      correlationId,
      count: request.count,
    });

    // 1. Mock sending prompt to OpenAI / Claude
    const rawAiResponse = await this.mockAiCall(request);

    // 2. Validate AI output using the contract schema
    const validationResult = AIResponseSchema.safeParse(rawAiResponse);

    if (!validationResult.success) {
      this.logger.error(
        "AI Runtime returned invalid payload shape",
        validationResult.error,
        { correlationId },
      );
      throw new Error("AI Provider returned malformed response");
    }

    return validationResult.data;
  }

  private async mockAiCall(request: LegacyGenerationRequest): Promise<unknown> {
    // Simulating raw unstructured JSON from AI Provider
    return {
      questions: [
        {
          text: `Sample ${request.topic} question`,
          options: ["A", "B", "C", "D"],
          correctAnswer: "A",
          difficulty: request.difficulty,
          topic: request.topic,
          tags: [request.topic],
        },
      ],
      metadata: {
        model: "gpt-4o",
        tokensUsed: 150,
        generationTimeMs: 1200,
      },
    };
  }
}
