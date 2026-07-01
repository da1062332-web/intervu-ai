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

    return {
      attempts: result.items.map((t, index) => ({
        instanceId: t.id,
        assessmentName: t.testConfig?.displayName || "Unknown Assessment",
        date: t.createdAt.toISOString(),
        score: t.evaluationResult?.overallScore || null,
        status: t.status,
        attemptNumber: result.total - (skip + index), // rough estimate of attempt number descending
        durationSeconds: null, // would calculate from completedAt - startedAt if available
      })),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
    };
  }
}
