import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CandidateResultDto } from "@intervu-ai/contracts";
import { AppLogger } from "@intervu-ai/shared-logger";

@Injectable()
export class ResultStorageService {
  private readonly logger = new AppLogger({ name: "ResultStorageService" });

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Saves the generated results and details to the database under a transaction.
   */
  async saveResult(result: CandidateResultDto, durationMs = 0): Promise<void> {
    const { attemptId, candidateId, score, percentage, analytics } = result;

    this.logger.info("Persisting assessment result to database", {
      attemptId,
      candidateId,
    });

    await this.prisma.$transaction(async (tx) => {
      // 1. Create or Update CandidateResult
      await tx.candidateResult.upsert({
        where: { attemptId },
        update: {
          score,
          percentage,
          createdAt: new Date(),
        },
        create: {
          id: result.id,
          candidateId,
          attemptId,
          score,
          percentage,
          createdAt: new Date(),
        },
      });

      // 2. Create or Update EvaluationAnalytics
      if (analytics) {
        await tx.evaluationAnalytics.upsert({
          where: { attemptId },
          update: {
            topicAccuracy: analytics.topicAccuracy || {},
            difficultyAccuracy: analytics.difficultyAccuracy || {},
            completionRate: analytics.completionRate,
            attemptRate: analytics.attemptRate,
            createdAt: new Date(),
          },
          create: {
            attemptId,
            topicAccuracy: analytics.topicAccuracy || {},
            difficultyAccuracy: analytics.difficultyAccuracy || {},
            completionRate: analytics.completionRate,
            attemptRate: analytics.attemptRate,
            createdAt: new Date(),
          },
        });
      }

      // 3. Update Submission status to EVALUATED
      await tx.submission.updateMany({
        where: { testInstanceId: attemptId },
        data: {
          status: "EVALUATED",
          updatedAt: new Date(),
        },
      });

      // 4. Log successful EvaluationRun
      await tx.evaluationRun.create({
        data: {
          attemptId,
          status: "COMPLETED",
          durationMs,
          createdAt: new Date(),
        },
      });
    });
  }

  /**
   * Logs a failed evaluation run.
   */
  async recordFailedRun(
    attemptId: string,
    errorMessage: string,
    durationMs = 0,
  ): Promise<void> {
    this.logger.warn("Recording failed evaluation run", {
      attemptId,
      errorMessage,
    });
    try {
      await this.prisma.evaluationRun.create({
        data: {
          attemptId,
          status: "FAILED",
          error: errorMessage.substring(0, 1000), // Trim error message if needed
          durationMs,
          createdAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.error("Failed to log evaluation run failure", err);
    }
  }
}
