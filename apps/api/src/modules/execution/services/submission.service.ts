// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Injectable, Inject, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { ExecutionValidatorService } from "./execution-validator.service";
import { SubmissionValidationService } from "./submission-validation.service";
import { EvaluationQueueService } from "../../evaluation/services/evaluation-queue.service";
import {
  TestInstanceRepository,
  SubmissionRepository,
  CandidateAnswerRepository,
} from "../repositories";
import {
  EVALUATION_ADAPTER,
  EvaluationAdapter,
} from "../interfaces/evaluation-adapter.interface";
// eslint-disable-next-line no-restricted-imports
import { ExecutionResultDto } from "../dto";

@Injectable()
export class SubmissionService {
  private readonly logger = new AppLogger({ name: "SubmissionService" });

  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: ExecutionValidatorService,
    private readonly testInstanceRepo: TestInstanceRepository,
    private readonly submissionRepo: SubmissionRepository,
    private readonly answerRepo: CandidateAnswerRepository,
    private readonly validationService: SubmissionValidationService,
    private readonly evaluationQueueService: EvaluationQueueService,
    @Inject(EVALUATION_ADAPTER)
    private readonly evaluationAdapter: EvaluationAdapter,
  ) {}

  async submitAssessment(
    testInstanceId: string,
    userId: string,
    isAutoSubmit = false,
  ): Promise<{ submissionId: string; status: string }> {
    this.logger.info("Initiating assessment submission", {
      testInstanceId,
      userId,
      isAutoSubmit,
    });

    // 1. Run pre-submission validation checks
    const validation = await this.validationService.validateSubmission(
      testInstanceId,
      userId,
    );

    if (!validation.isValid) {
      if (validation.isDuplicate) {
        throw new ConflictException({
          code: "DUPLICATE_SUBMISSION",
          message: "This assessment has already been submitted.",
        });
      }
      if (validation.isExpired && !isAutoSubmit) {
        throw new BadRequestException({
          code: "EXPIRED_SESSION",
          message: "The allowed time window for this assessment has expired.",
        });
      }
      if (validation.missingQuestionIds.length > 0 && !isAutoSubmit) {
        throw new BadRequestException({
          code: "MISSING_ANSWERS",
          message: `${validation.missingQuestionIds.length} required questions have not been answered.`,
          details: validation.missingQuestionIds,
        });
      }
      if (!isAutoSubmit) {
        throw new BadRequestException({
          code: "VALIDATION_FAILED",
          message: "Pre-submission validation pipeline failed.",
          details: validation.errors,
        });
      }
    }

    const { submission, executionResult } = await this.prisma.$transaction(
      async (tx) => {
        // 2. Lock and fetch assessment
        const testInstance = await this.validator.validateAssessment(
          testInstanceId,
          tx,
        );

        // 3. Ownership
        this.validator.validateOwnership(testInstance, userId);

        // 4. Check if already submitted
        this.validator.validateSubmissionState(testInstance);

        // 5. Update Status to SUBMITTED
        const repo = this.testInstanceRepo.withTransaction(tx);
        await repo.update(testInstance.id, {
          status: "SUBMITTED",
          submittedAt: new Date(),
        });

        // 6. Create Submission record
        const subRepo = this.submissionRepo.withTransaction(tx);
        const submission = await subRepo.create({
          testInstance: { connect: { id: testInstanceId } },
          status: "SUBMITTED",
          submittedAt: new Date(),
        });

        // 7. Collect answers for Evaluation
        const ansRepo = this.answerRepo.withTransaction(tx);
        const answers = await ansRepo.findAll({ testInstanceId });

        const executionResult: ExecutionResultDto = {
          executionId: submission.id,
          testId: testInstanceId,
          status: "submitted",
          submittedAt: new Date(),
          answers: answers.map((a) => ({
            questionId: a.questionId,
            answer: String(a.answer), // assuming scalar for now
            timeSpentSeconds: a.timeSpentSeconds,
            isMarkedForReview: a.isMarkedForReview,
          })),
        };

        return { submission, executionResult };
      },
    );

    this.logger.info(
      "Transaction committed successfully, enqueuing to evaluation queue",
      {
        submissionId: submission.id,
        testInstanceId,
      },
    );

    // 8. Convert answers array to map for the queue
    const answersMap: Record<string, string> = {};
    executionResult.answers.forEach((ans) => {
      answersMap[ans.questionId] = ans.answer;
    });

    // 9. Enqueue evaluation in background queue
    await this.evaluationQueueService.enqueueSubmission(
      submission.id,
      testInstanceId,
      userId,
      answersMap,
    );

    return {
      submissionId: submission.id,
      status: isAutoSubmit ? "EXPIRED_AND_SUBMITTED" : "SUBMITTED",
    };
  }
}
