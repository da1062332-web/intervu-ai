import { Injectable, BadRequestException, NotFoundException, ConflictException } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { QueueService } from "../../../queue/queue.service";
import { SubmissionStatus } from "@prisma/client";

@Injectable()
export class EvaluationQueueService {
  private readonly logger = new AppLogger({ name: "EvaluationQueueService" });

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async enqueueSubmission(
    submissionId: string,
    testInstanceId: string,
    userId: string,
    answers: Record<string, string>,
  ): Promise<any> {
    this.logger.debug("Enqueuing submission for evaluation", { submissionId, testInstanceId });

    // 1. Prevent duplicate evaluation
    const existingSubmission = await this.prisma.submission.findUnique({
      where: { testInstanceId },
    });

    if (existingSubmission && existingSubmission.status === SubmissionStatus.EVALUATED) {
      this.logger.warn("Evaluation already completed for this attempt", { testInstanceId });
      throw new ConflictException({
        code: "EVALUATION_ALREADY_COMPLETED",
        message: "Evaluation has already been completed for this assessment.",
      });
    }

    // 2. Push evaluation job to BullMQ
    try {
      await this.queueService.enqueueEvaluation({
        jobId: submissionId,
        timestamp: Date.now(),
        userId,
        payload: {
          testId: testInstanceId,
          userId,
          answers,
        },
      });

      // 3. Update Submission record to track queue status
      return await this.prisma.submission.update({
        where: { testInstanceId },
        data: {
          status: SubmissionStatus.SUBMITTED,
          errorMessage: null,
        },
      });
    } catch (error) {
      this.logger.error("Failed to enqueue evaluation in background queue", error, { testInstanceId });
      
      // Update submission record with queue error
      await this.prisma.submission.update({
        where: { testInstanceId },
        data: {
          errorMessage: error instanceof Error ? error.message : "Failed to enqueue",
        },
      });
      throw error;
    }
  }

  async getEvaluationStatus(attemptId: string): Promise<any> {
    this.logger.debug("Fetching evaluation status", { attemptId });

    const submission = await this.prisma.submission.findUnique({
      where: { testInstanceId: attemptId },
    });

    if (!submission) {
      throw new NotFoundException({
        code: "SUBMISSION_NOT_FOUND",
        message: "Submission not found for this attempt",
      });
    }

    return {
      submissionId: submission.id,
      testInstanceId: submission.testInstanceId,
      status: submission.status,
      retryCount: submission.retryCount,
      errorMessage: submission.errorMessage,
      submittedAt: submission.submittedAt,
      updatedAt: submission.updatedAt,
    };
  }

  async retryFailedEvaluation(attemptId: string): Promise<any> {
    this.logger.info("Retrying failed evaluation", { attemptId });

    const submission = await this.prisma.submission.findUnique({
      where: { testInstanceId: attemptId },
    });

    if (!submission) {
      throw new NotFoundException({
        code: "SUBMISSION_NOT_FOUND",
        message: "Submission not found",
      });
    }

    if (submission.status === SubmissionStatus.EVALUATED) {
      throw new ConflictException({
        code: "EVALUATION_ALREADY_COMPLETED",
        message: "Cannot retry evaluation that has already completed successfully.",
      });
    }

    // Fetch answers for the attempt
    const answers = await this.prisma.candidateAnswer.findMany({
      where: { testInstanceId: attemptId },
    });

    const answersMap: Record<string, string> = {};
    answers.forEach((ans) => {
      answersMap[ans.questionId] = String(ans.answer);
    });

    // Reset error, increment retryCount, and enqueue
    await this.prisma.submission.update({
      where: { testInstanceId: attemptId },
      data: {
        retryCount: {
          increment: 1,
        },
        errorMessage: null,
        status: SubmissionStatus.SUBMITTED,
      },
    });

    await this.queueService.enqueueEvaluation({
      jobId: submission.id,
      timestamp: Date.now(),
      userId: submission.testInstanceId, // reusing testInstanceId as fallback user identifier in queue
      payload: {
        testId: attemptId,
        userId: attemptId, // fallback
        answers: answersMap,
      },
    });

    return {
      success: true,
      message: "Evaluation successfully enqueued for retry",
    };
  }
}
