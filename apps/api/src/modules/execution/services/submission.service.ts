// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { ExecutionValidatorService } from "./execution-validator.service";
import { TestInstanceRepository, SubmissionRepository, CandidateAnswerRepository } from "../repositories";
import { EVALUATION_ADAPTER, EvaluationAdapter } from "../interfaces/evaluation-adapter.interface";
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
    @Inject(EVALUATION_ADAPTER) private readonly evaluationAdapter: EvaluationAdapter,
  ) {}

  async submitAssessment(testInstanceId: string, userId: string, isAutoSubmit = false): Promise<{ submissionId: string; status: string }> {
    this.logger.info("Initiating assessment submission", { testInstanceId, userId, isAutoSubmit });

    const { submission, executionResult } = await this.prisma.$transaction(async (tx) => {
      // 1. Lock and fetch assessment
      const testInstance = await this.validator.validateAssessment(testInstanceId, tx);

      // 2. Ownership
      this.validator.validateOwnership(testInstance, userId);

      // 3. Check if already submitted
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
        answers: answers.map(a => ({
          questionId: a.questionId,
          answer: String(a.answer), // assuming scalar for now
          timeSpentSeconds: a.timeSpentSeconds,
          isMarkedForReview: a.isMarkedForReview,
        })),
      };

      return { submission, executionResult };
    });

    this.logger.info("Transaction committed successfully, triggering evaluation", { 
      submissionId: submission.id, 
      testInstanceId 
    });

    // 8. Trigger Evaluation (Mocked via DI adapter) outside the DB transaction
    // This prevents slow evaluation engines from blocking DB connections
    await this.evaluationAdapter.triggerEvaluation(executionResult);

    return {
      submissionId: submission.id,
      status: isAutoSubmit ? "EXPIRED_AND_SUBMITTED" : "SUBMITTED",
    };
  }
}

