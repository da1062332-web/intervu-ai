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
    const count = request.count || 10;
    
    // Check if topic is a math topic
    let isMathTopic = false;
    let topicName = request.topic;
    
    try {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      const topicRecord = await prisma.topic.findFirst({
        where: {
          OR: [
            { id: request.topic },
            { code: request.topic }
          ]
        }
      });
      if (topicRecord) {
        topicName = topicRecord.name;
        if (topicRecord.code.includes("MATH") || topicRecord.name.toLowerCase().includes("math")) {
          isMathTopic = true;
        }
      }
      await prisma.$disconnect();
    } catch {
      if (request.topic.toLowerCase().includes("math")) {
        isMathTopic = true;
      }
    }

    const questions = Array.from({ length: count }, (_, i) => {
      if (isMathTopic) {
        const a = 10 + Math.floor(Math.random() * 9) * 10; // 10, 20, ..., 90
        const b = 100 + Math.floor(Math.random() * 10) * 100; // 100, 200, ..., 1000
        const ans = Math.round((a / 100) * b);
        
        return {
          text: `What is ${a}% of ${b}?`,
          options: [
            `Option A: ${ans}`,
            `Option B: ${ans + 50}`,
            `Option C: ${ans - 25}`,
            `Option D: ${ans * 2}`,
          ],
          correctAnswer: "Option A",
          difficulty: request.difficulty,
          topic: topicName,
          tags: [topicName],
        };
      }
      
      return {
        text: `Sample ${topicName} question ${i + 1}`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A",
        difficulty: request.difficulty,
        topic: topicName,
        tags: [topicName],
      };
    });

    return {
      questions,
      metadata: {
        model: "gpt-4o",
        tokensUsed: 150 * count,
        generationTimeMs: 1200,
      },
    };
  }
}
