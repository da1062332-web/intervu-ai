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

    // Fetch questions from the DB question bank (the authoritative source).
    // Throws a retryable error if no questions are available — BullMQ will
    // retry automatically per queue backoff config.
    const rawAiResponse = await this.fetchQuestionsFromSource(request);

    // Validate output shape against the contract schema
    const validationResult = AIResponseSchema.safeParse(rawAiResponse);

    if (!validationResult.success) {
      this.logger.error(
        "Question source returned invalid payload shape",
        validationResult.error,
        { correlationId },
      );
      throw new Error("Question source returned malformed response");
    }

    return validationResult.data;
  }

  /**
   * Fetches questions for the generation job from the DB question bank.
   *
   * Strategy:
   *  1. Resolve topic name and detect subject type from the DB.
   *  2. Query published (ACTIVE) questions matching topic + difficulty.
   *  3. If questions found → return them (DB-bank source).
   *  4. If no questions found → throw a retryable Error so BullMQ retries
   *     the job rather than silently persisting placeholder/fake data.
   */
  private async fetchQuestionsFromSource(
    request: LegacyGenerationRequest,
  ): Promise<unknown> {
    const count = request.count || 10;
    let topicName = request.topic;

    const difficultyMap: Record<string, string> = {
      beginner: "EASY",
      intermediate: "MEDIUM",
      advanced: "HARD",
      expert: "HARD",
    };
    const dbDifficulty = difficultyMap[request.difficulty] || "MEDIUM";

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    try {
      // 1. Resolve topic record
      const topicRecord = await prisma.topic.findFirst({
        where: {
          OR: [{ id: request.topic }, { code: request.topic }],
        },
      });

      if (topicRecord) {
        topicName = topicRecord.name;
      }

      // 2. Query ACTIVE questions from the question bank
      const bankQuestions = await prisma.question.findMany({
        where: {
          topicId: request.topic,
          status: "ACTIVE",
          difficulty: dbDifficulty as any,
        },
        take: count,
        orderBy: { createdAt: "asc" },
      });

      if (bankQuestions && bankQuestions.length > 0) {
        this.logger.info(
          `Resolved ${bankQuestions.length} questions from DB question bank`,
          { topic: request.topic, difficulty: dbDifficulty },
        );

        const questions = bankQuestions.map((q) => ({
          text: q.questionText,
          options: (q.metadata && (q.metadata as any).options) || [q.answer],
          correctAnswer: q.answer,
          explanation: q.explanation || "No explanation provided.",
          difficulty: request.difficulty,
          topic: topicName,
          tags: [topicName],
        }));

        return {
          questions,
          metadata: {
            source: "QUESTION_BANK",
            returnedFrom: "DB",
            count: questions.length,
          },
        };
      }

      // 3. No questions available — throw retryable error.
      // BullMQ will retry up to the configured attempts (3) with exponential backoff.
      // Do NOT fall back to placeholder/fake data to avoid silently corrupting results.
      throw new Error(
        `No ACTIVE questions found in question bank for topic "${request.topic}" ` +
          `at difficulty "${dbDifficulty}". Job will be retried.`,
      );
    } finally {
      await prisma.$disconnect();
    }
  }
}
