import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
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

import { ExecutionResultDto } from "../dto";
import { RedisCacheService } from "../../../cache/redis-cache.service";

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
    private readonly cacheService: RedisCacheService,
    @Inject(EVALUATION_ADAPTER)
    private readonly evaluationAdapter: EvaluationAdapter,
  ) {}

  async submitAssessment(
    testInstanceId: string,
    userId: string,
    isAutoSubmit = false,
    source: "USER" | "SYSTEM" | "RULE_ENGINE" | "TIMEOUT" | "ADMIN" = isAutoSubmit ? "TIMEOUT" : "USER",
    reason: "USER_SUBMIT" | "TIME_EXPIRED" | "PROCTORING_LIMIT" | "NETWORK_FAILURE" | "SESSION_EXPIRY" | "SYSTEM_FAILURE" | "ADMIN_ACTION" | "OTHER" = isAutoSubmit ? "TIME_EXPIRED" : "USER_SUBMIT",
    reasonDetails?: string,
    allowPartial = false,
  ): Promise<{ submissionId: string; status: string }> {
    this.logger.info("Initiating assessment submission", {
      testInstanceId,
      userId,
      isAutoSubmit,
      allowPartial,
      source,
      reason,
    });

    // A. Submission Idempotency: Check if already submitted
    const existingSubmission = await this.prisma.submission.findFirst({
      where: { testInstanceId, isCurrent: true },
    });
    if (
      existingSubmission &&
      (existingSubmission.status === "SUBMITTED" ||
        existingSubmission.status === "EVALUATED")
    ) {
      this.logger.info(
        "Submission already processed, returning existing reference (idempotency)",
        {
          testInstanceId,
          submissionId: existingSubmission.id,
        },
      );
      return {
        submissionId: existingSubmission.id,
        status: existingSubmission.status,
      };
    }

    const testInstanceCheck = await this.prisma.testInstance.findUnique({
      where: { id: testInstanceId },
      include: { submissions: { where: { isCurrent: true }, take: 1 } },
    });
    const currentSub = testInstanceCheck?.submissions?.[0];
    if (
      testInstanceCheck &&
      (testInstanceCheck.status === "SUBMITTED" ||
        testInstanceCheck.status === "COMPLETED")
    ) {
      this.logger.info(
        "TestInstance already marked SUBMITTED, returning existing reference (idempotency)",
        {
          testInstanceId,
          submissionId: currentSub?.id,
        },
      );
      return {
        submissionId: currentSub?.id || testInstanceId,
        status: currentSub?.status || "SUBMITTED",
      };
    }

    // B. Locking & Double-Submit Guard via an atomic distributed lock.
    // Shared with ProctoringMonitoringService's strike auto-submit and
    // AttemptRecoveryService's admin force-submit, so at most one of the
    // three submission-creation paths can ever be mid-write for a given
    // attempt at once — closing the race where two of them read the same
    // "existing submission count" and both insert an isCurrent row.
    const lockKey = `submission-create:${testInstanceId}`;
    const lockAcquired = await this.cacheService.acquireLock(lockKey, 30);
    if (!lockAcquired) {
      throw new ConflictException(
        "Submission is already in progress for this assessment attempt.",
      );
    }

    try {
      // 1. Run pre-submission validation checks
      let validation = await this.validationService.validateSubmission(
        testInstanceId,
        userId,
      );

      // C. Late Submissions: If expired, force auto-submit flow to truncate and save state
      if (validation.isExpired && !isAutoSubmit) {
        this.logger.warn(
          "Manual submission received after expiration. Forcing auto-submit handling to preserve candidate answers.",
          {
            testInstanceId,
          },
        );
        isAutoSubmit = true;
      }

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
        if (validation.missingQuestionIds.length > 0 && !isAutoSubmit && !allowPartial) {
          throw new BadRequestException({
            code: "MISSING_ANSWERS",
            message: `${validation.missingQuestionIds.length} required questions have not been answered.`,
            details: validation.missingQuestionIds,
          });
        }
        if (!isAutoSubmit) {
          const remainingErrors = allowPartial
            ? validation.errors.filter((e) => !e.startsWith("Missing Answers:"))
            : validation.errors;

          if (remainingErrors.length > 0) {
            throw new BadRequestException({
              code: "VALIDATION_FAILED",
              message: "Pre-submission validation pipeline failed.",
              details: remainingErrors,
            });
          }
        }
      }

      // Only the writes that must be atomic live inside the transaction below.
      // Reading back the answers to build the evaluation payload is read-only
      // and doesn't need transactional isolation — running it after commit
      // keeps the transaction to a handful of indexed point-writes instead
      // of holding a scarce pgbouncer transaction-mode connection open for a
      // full-attempt answer scan too. That matters most exactly when it's
      // riskiest: everyone submitting together near a shared deadline.
      const submission = await this.prisma.$transaction(
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

          // 5. Update Status to SUBMITTED or AUTO_SUBMITTED
          const targetStatus = isAutoSubmit ? "AUTO_SUBMITTED" : "SUBMITTED";
          const repo = this.testInstanceRepo.withTransaction(tx);
          await repo.update(testInstance.id, {
            status: targetStatus as any,
            submittedAt: new Date(),
          });

          // 6. Create sequential Submission record idempotently (Forensic Immutability)
          const existingCount = await tx.submission.count({
            where: { testInstanceId },
          });
          if (existingCount > 0) {
            await tx.submission.updateMany({
              where: { testInstanceId, isCurrent: true },
              data: { isCurrent: false },
            });
          }

          const submission = await tx.submission.create({
            data: {
              testInstanceId,
              status: isAutoSubmit ? "AUTO_SUBMITTED" : (existingCount > 0 ? "FINAL_SUBMITTED" : "SUBMITTED"),
              source: source as any,
              reason: reason as any,
              reasonDetails,
              isAutoSubmit,
              attemptSequence: existingCount + 1,
              isCurrent: true,
              submittedAt: new Date(),
            },
          });

          // 6a. Record immutable assessment event
          const assessmentId =
            (testInstance as any).examConfigId ||
            (testInstance as any).testConfigId ||
            "unknown";
          await tx.assessmentEvent.create({
            data: {
              assessmentId,
              attemptId: testInstanceId,
              candidateId: userId,
              eventType: isAutoSubmit ? "AUTO_SUBMITTED" : "SUBMITTED",
              source: source as string,
              severity: isAutoSubmit ? "P1" : "P3",
              metadata: { source, reason, reasonDetails },
            },
          });

          return submission;
        },
        {
          // The transaction now only does a handful of indexed point-writes
          // (status update, submission count/create, one event insert) — if
          // that doesn't finish in a few seconds something is actually wrong,
          // and failing fast releases the pooled connection instead of
          // holding it for up to the previous 90s ceiling.
          timeout: 15000,
          maxWait: 10000,
        },
      );

      this.logger.info(
        "Transaction committed successfully, collecting answers for evaluation queue",
        {
          submissionId: submission.id,
          testInstanceId,
        },
      );

      // 7. Collect answers for evaluation — read-only, done after commit so
      // it never holds the transactional connection open.
      const answers = await this.answerRepo.findAll({ testInstanceId });

      const executionResult: ExecutionResultDto = {
        executionId: submission.id,
        testId: testInstanceId,
        status: "submitted",
        submittedAt: new Date(),
        answers: answers.map((a) => {
          // Safely extract the answer string from the Prisma Json field
          let answerStr = "";
          if (typeof a.answer === "string") {
            answerStr = a.answer;
          } else if (typeof a.answer === "object" && a.answer !== null) {
            const ansObj = a.answer as Record<string, any>;
            // For coding submissions, preserve the complete JSON payload
            if (
              ansObj.code !== undefined ||
              ansObj.sourceCode !== undefined ||
              ansObj.files !== undefined
            ) {
              answerStr = JSON.stringify(a.answer);
            } else {
              // For MCQs, extract the specific option value
              answerStr =
                ansObj.selectedOptionId ||
                ansObj.answer ||
                ansObj.textResponse ||
                ansObj.value ||
                JSON.stringify(a.answer);
            }
          } else {
            answerStr = String(a.answer || "");
          }
          return {
            questionId: a.questionId,
            answer: answerStr,
            timeSpentSeconds: a.timeSpentSeconds,
            isMarkedForReview: a.isMarkedForReview,
          };
        }),
      };

      // CON-003: Invalidate cached test instance state so autosave cannot use
      // stale IN_PROGRESS status and write answers after submission
      await Promise.allSettled([
        this.cacheService.delete(`test-instance:meta:${testInstanceId}`),
        this.cacheService.delete(`execution-state:${testInstanceId}`),
        this.cacheService.delete(`assessment-snapshot:${testInstanceId}`),
      ]);
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
    } finally {
      await this.cacheService.releaseLock(lockKey);
    }
  }
}
