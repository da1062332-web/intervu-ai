import { Injectable, BadRequestException } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { ExecutionValidatorService } from "./execution-validator.service";
import { ExecutionStateService } from "./execution-state.service";
import { CandidateAnswerRepository } from "../repositories";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { CandidateAnswerDto } from "../dto";
import { Prisma, TestInstance } from "@prisma/client";

@Injectable()
export class AutosaveService {
  private readonly logger = new AppLogger({ name: "AutosaveService" });

  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: ExecutionValidatorService,
    private readonly stateService: ExecutionStateService,
    private readonly answerRepo: CandidateAnswerRepository,
    private readonly cacheService: RedisCacheService,
  ) {}

  async saveAnswer(
    testInstanceId: string,
    userId: string,
    dto: CandidateAnswerDto,
  ): Promise<{ status: string; saved?: boolean; message?: string }> {
    const startTime = Date.now();
    this.logger.debug("Executing optimized autosave", {
      testInstanceId,
      questionId: dto.questionId,
    });

    // 1. Fetch TestInstance metadata from Cache (or fallback to DB)
    const cacheKey = `test-instance:meta:${testInstanceId}`;
    let testInstance = await this.cacheService.get<TestInstance>(cacheKey);

    if (!testInstance) {
      testInstance = await this.validator.validateAssessment(testInstanceId);
      await this.cacheService.set(cacheKey, testInstance, { ttl: 600 }); // Cache for 10 minutes
    }

    // 2. Validate ownership & submission state
    this.validator.validateOwnership(testInstance, userId);
    this.validator.validateSubmissionState(testInstance);

    if (testInstance.status === "CREATED") {
      await this.prisma.testInstance
        .update({
          where: { id: testInstanceId },
          data: { status: "IN_PROGRESS", startedAt: testInstance.startedAt || new Date() },
        })
        .catch(() => {});
      (testInstance as any).status = "IN_PROGRESS";
      await this.cacheService.set(cacheKey, testInstance, { ttl: 600 });
    }

    // 3. Load or initialize execution state from cache/DB
    const stateCacheKey = `execution-state:${testInstanceId}`;
    let cachedState = await this.cacheService.get<{
      remainingTimeSeconds: number;
      currentQuestionIndex: number;
    }>(stateCacheKey);

    if (!cachedState) {
      const state = await this.stateService.restoreProgress(testInstanceId);
      const initialRemaining = testInstance.expiresAt
        ? Math.max(
            0,
            Math.floor(
              (new Date(testInstance.expiresAt).getTime() - Date.now()) / 1000,
            ),
          )
        : 0;

      cachedState = {
        remainingTimeSeconds: state?.remainingTimeSeconds ?? initialRemaining,
        currentQuestionIndex: state?.currentQuestionIndex ?? 0,
      };
      await this.cacheService.set(stateCacheKey, cachedState, { ttl: 600 });
    }

    // 4. Validate Timer
    const { isExpired, actualRemainingTime } = this.validator.validateTimer(
      testInstance,
      { remainingTimeSeconds: cachedState.remainingTimeSeconds } as any,
      dto.timeSpentSeconds
        ? cachedState.remainingTimeSeconds - dto.timeSpentSeconds
        : undefined,
    );

    if (isExpired) {
      this.logger.warn("Timer expired during autosave", {
        testInstanceId,
        userId,
      });
      return { status: "expired" };
    }

    // 4a. Validate that the question's section is not locked.
    // Both lookups below are cached: examConfig.ruleFlags is effectively
    // static for the lifetime of a running assessment (long TTL is safe),
    // while section lock status can change mid-exam (a proctor can lock a
    // section), so it gets a short TTL — enough to absorb a burst of rapid
    // autosaves from one candidate without going stale for more than a
    // few seconds.
    const configId =
      testInstance.examConfigId || (testInstance as any).testConfigId;
    let allowSectionNav = false;
    if (configId) {
      const allowSectionNavCacheKey = `exam-config:allow-section-nav:${configId}`;
      const cachedFlag = await this.cacheService.get<boolean>(allowSectionNavCacheKey);
      if (cachedFlag !== null && cachedFlag !== undefined) {
        allowSectionNav = cachedFlag;
      } else {
        const examConfig = await this.prisma.examConfig.findUnique({
          where: { id: configId },
          include: { ruleFlags: true },
        });
        allowSectionNav = examConfig?.ruleFlags?.allowSectionNavigation ?? false;
        await this.cacheService.set(allowSectionNavCacheKey, allowSectionNav, { ttl: 600 });
      }
    }

    if (!allowSectionNav) {
      const sectionStatusCacheKey = `section-status:${testInstanceId}:${dto.questionId}`;
      let sectionStatus = await this.cacheService.get<string | null>(sectionStatusCacheKey);

      if (sectionStatus === null || sectionStatus === undefined) {
        const questionSection = await this.prisma.testInstanceQuestion.findFirst({
          where: { testInstanceId, questionId: dto.questionId },
          include: { section: true },
        });
        sectionStatus = questionSection?.section?.status ?? "";
        await this.cacheService.set(sectionStatusCacheKey, sectionStatus, { ttl: 5 });
      }

      if (
        sectionStatus === "LOCKED" ||
        sectionStatus === "COMPLETED" ||
        sectionStatus === "EXPIRED"
      ) {
        this.logger.warn("Autosave rejected: section is locked", {
          testInstanceId,
          questionId: dto.questionId,
          sectionStatus,
        });
        return {
          status: "locked",
          saved: false,
          message: "This section is locked and no longer accepts answers.",
        };
      }
    }

    // 5. Validate question
    this.validator.validateQuestion(testInstanceId, dto.questionId);

    // 6. Write answer to cache (fast write back for recovery)
    const answerCacheKey = `autosave:answers:${testInstanceId}:${dto.questionId}`;
    await this.cacheService.set(
      answerCacheKey,
      {
        answer: dto.answer,
        timeSpentSeconds: dto.timeSpentSeconds,
        isMarkedForReview: dto.isMarkedForReview,
        savedAt: new Date(),
      },
      { ttl: 3600 },
    );

    // 7. Write to PostgreSQL using direct transaction-free upsert with retry logic
    const newRemainingTime = Math.max(0, actualRemainingTime);
    await this.persistToDbWithRetry(testInstanceId, dto, newRemainingTime);

    // 8. Update execution state cache
    cachedState.remainingTimeSeconds = newRemainingTime;
    await this.cacheService.set(stateCacheKey, cachedState, { ttl: 600 });

    const duration = Date.now() - startTime;
    this.logger.debug("Autosave completed", {
      testInstanceId,
      durationMs: duration,
    });
    return { status: "saved" };
  }

  private async persistToDbWithRetry(
    testInstanceId: string,
    dto: CandidateAnswerDto,
    remainingTime: number,
    retries = 3,
    delay = 50,
  ): Promise<void> {
    let attempt = 0;
    while (attempt < retries) {
      try {
        // Direct parallel upserts without interactive $transaction.
        // This avoids holding open connections and hitting transaction pooler timeouts on PgBouncer.
        await Promise.all([
          this.prisma.candidateAnswer.upsert({
            where: {
              testInstanceId_questionId: {
                testInstanceId,
                questionId: dto.questionId,
              },
            },
            update: {
              answer: dto.answer as unknown as Prisma.InputJsonValue,
              timeSpentSeconds: {
                increment: dto.timeSpentSeconds || 0,
              },
              isMarkedForReview:
                dto.isMarkedForReview !== undefined
                  ? dto.isMarkedForReview
                  : undefined,
              savedAt: new Date(),
            },
            create: {
              testInstanceId,
              questionId: dto.questionId,
              answer: dto.answer as unknown as Prisma.InputJsonValue,
              timeSpentSeconds: dto.timeSpentSeconds || 0,
              isMarkedForReview: dto.isMarkedForReview || false,
              savedAt: new Date(),
            },
          }),
          this.prisma.executionState.upsert({
            where: {
              testInstanceId,
            },
            update: {
              remainingTimeSeconds: remainingTime,
              lastActivityAt: new Date(),
            },
            create: {
              testInstanceId,
              currentQuestionIndex: 0,
              remainingTimeSeconds: remainingTime,
              lastActivityAt: new Date(),
            },
          }),
        ]);
        return; // Success
      } catch (error) {
        attempt++;
        this.logger.warn(
          `Database write failed, retrying (${attempt}/${retries})...`,
          {
            testInstanceId,
            error: error instanceof Error ? error.message : error,
          },
        );
        if (attempt >= retries) {
          throw error;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(2, attempt)),
        );
      }
    }
  }
}
