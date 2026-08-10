import { Injectable } from "@nestjs/common";
import { AttemptHistoryRepository } from "../repositories/attempt-history.repository";
import { AttemptHistoryResponseDto } from "../dto/attempt-history.dto";

@Injectable()
export class AttemptHistoryService {
  constructor(
    private readonly attemptHistoryRepository: AttemptHistoryRepository,
  ) {}

  async getAttemptHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<AttemptHistoryResponseDto> {
    const skip = (page - 1) * limit;

    const result = await this.attemptHistoryRepository.findAttemptsByUser({
      userId,
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(result.total / limit);

    const attemptsWithCounts = await Promise.all(
      result.items.map(async (t: any, index: number) => {
        const rawScore =
          t.candidateResult?.percentage ??
          t.candidateResult?.score ??
          t.evaluationResult?.overallScore ??
          null;

        let score =
          typeof rawScore === "number"
            ? rawScore <= 1 && rawScore > 0
              ? Math.round(rawScore * 100)
              : Math.round(rawScore)
            : null;

        // If attempt is completed or submitted, fallback missing score to 0
        if (
          score === null &&
          (t.status === "COMPLETED" || t.status === "SUBMITTED")
        ) {
          score = 0;
        }

        const status =
          (Boolean(t.evaluationResult) ||
            Boolean(t.candidateResult) ||
            rawScore !== null) &&
          (t.status === "SUBMITTED" || t.status === "COMPLETED")
            ? "COMPLETED"
            : t.status;

        const maxAttempts = (t.examConfig?.ruleFlags?.maxAttempts as number) || 3;
        const attemptCount = await this.attemptHistoryRepository.countAttemptsByConfig(userId, t.examConfigId, t.testConfigId);
        const remainingAttempts = Math.max(0, maxAttempts - attemptCount);
        const canReAttempt = remainingAttempts > 0;

        return {
          instanceId: t.id,
          attemptId: t.id,
          examConfigId: t.examConfigId,
          testConfigId: t.testConfigId,
          testName:
            t.testConfig?.displayName ||
            t.examConfig?.name ||
            "Unknown Assessment",
          assessmentName:
            t.testConfig?.displayName ||
            t.examConfig?.name ||
            "Unknown Assessment",
          date: t.createdAt.toISOString(),
          submittedAt: t.submittedAt
            ? t.submittedAt.toISOString()
            : t.createdAt.toISOString(),
          score,
          percentage: score,
          maxScore: 100,
          evaluationId: t.evaluationResult ? `eval_${t.id}` : null,
          status,
          attemptNumber: attemptCount, // Overwrite with actual attempt count for this specific config
          attemptCount,
          maxAttempts,
          remainingAttempts,
          canReAttempt,
          durationSeconds:
            t.startedAt && t.submittedAt
              ? Math.floor(
                  (t.submittedAt.getTime() - t.startedAt.getTime()) / 1000,
                )
              : 3600,
          duration:
            t.startedAt && t.submittedAt
              ? Math.floor(
                  (t.submittedAt.getTime() - t.startedAt.getTime()) / 1000,
                )
              : 3600,
        };
      })
    );

    return {
      attempts: attemptsWithCounts,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
    };
  }
}
