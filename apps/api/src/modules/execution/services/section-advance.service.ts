import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { ExecutionValidatorService } from "./execution-validator.service";
import { SubmissionService } from "./submission.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";

export interface SectionAdvanceResult {
  nextSectionIndex: number | null;
  nextSectionId: string | null;
  serverTime: string;
  isLastSection: boolean;
  submitted: boolean;
}

@Injectable()
export class SectionAdvanceService {
  private readonly logger = new AppLogger({ name: "SectionAdvanceService" });

  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: ExecutionValidatorService,
    private readonly submissionService: SubmissionService,
    private readonly cacheService: RedisCacheService,
  ) {}

  async advanceSection(
    testInstanceId: string,
    userId: string,
  ): Promise<SectionAdvanceResult> {
    // Idempotency lock via Redis to prevent duplicate transitions
    const lockKey = `lock:section-advance:${testInstanceId}`;
    const isLocked = await this.cacheService.get<string>(lockKey);
    if (isLocked) {
      throw new ConflictException(
        "A section transition is already in progress. Please wait.",
      );
    }
    await this.cacheService.set(lockKey, "true", { ttl: 15 });

    try {
      return await this._doAdvance(testInstanceId, userId);
    } finally {
      await this.cacheService.delete(lockKey);
    }
  }

  private async _doAdvance(
    testInstanceId: string,
    userId: string,
  ): Promise<SectionAdvanceResult> {
    // 1. Validate assessment
    const testInstance =
      await this.validator.validateAssessment(testInstanceId);
    this.validator.validateOwnership(testInstance, userId);
    this.validator.validateSubmissionState(testInstance);

    // 2. Load sections ordered by orderIndex
    const sections = await this.prisma.testInstanceSection.findMany({
      where: { testInstanceId },
      orderBy: { orderIndex: "asc" },
    });

    if (!sections.length) {
      throw new NotFoundException("No sections found for this assessment");
    }

    // 3. Load execution state to get current section index
    const executionState = await this.prisma.executionState.findUnique({
      where: { testInstanceId },
    });

    const currentSectionIndex = executionState?.currentSectionIndex ?? 0;
    const currentSection = sections[currentSectionIndex];

    if (!currentSection) {
      throw new BadRequestException("Current section not found");
    }

    const now = new Date();

    // CON-002: Idempotency check — if the section was already advanced by another
    // concurrent request that completed between our Redis lock acquisition and now,
    // return the current state without double-advancing.
    // This is detected when the current section is already COMPLETED or LOCKED
    // and the next section already exists.
    if (
      currentSection.status === "COMPLETED" ||
      currentSection.status === "LOCKED"
    ) {
      const nextSectionIndex = currentSectionIndex + 1;
      const nextSection = sections[nextSectionIndex];
      this.logger.warn(
        "CON-002: Section advance already completed, returning idempotent result",
        {
          testInstanceId,
          currentSectionIndex,
          currentSectionStatus: currentSection.status,
        },
      );
      return {
        nextSectionIndex: nextSection ? nextSectionIndex : null,
        nextSectionId: nextSection ? nextSection.id : null,
        serverTime: now.toISOString(),
        isLastSection: !nextSection,
        submitted: !nextSection,
      };
    }

    // 4. Mark current section as COMPLETED
    await this.prisma.testInstanceSection.update({
      where: { id: currentSection.id },
      data: {
        status: "COMPLETED",
        updatedAt: now,
      },
    });

    this.logger.info(`Section ${currentSection.sectionName} marked COMPLETED`, {
      testInstanceId,
      sectionIndex: currentSectionIndex,
    });

    const isLastSection = currentSectionIndex >= sections.length - 1;

    if (isLastSection) {
      // 5a. Final section expired → auto-submit
      this.logger.info("Final section completed, auto-submitting assessment", {
        testInstanceId,
        userId,
      });

      // Fire and forget – we return immediately; submission is idempotent
      this.submissionService
        .submitAssessment(testInstanceId, userId, true)
        .catch((err) => {
          this.logger.error("Auto-submit after last section failed", {
            testInstanceId,
            error: err instanceof Error ? err.message : err,
          });
        });

      return {
        nextSectionIndex: null,
        nextSectionId: null,
        serverTime: now.toISOString(),
        isLastSection: true,
        submitted: true,
      };
    }

    // 5b. Advance to next section
    const nextSectionIndex = currentSectionIndex + 1;
    const nextSection = sections[nextSectionIndex];

    // 6. Lock previous sections (all sections before nextSectionIndex become LOCKED)
    const previousSectionIds = sections
      .slice(0, nextSectionIndex)
      .filter((s) => s.status !== "LOCKED")
      .map((s) => s.id);

    if (previousSectionIds.length > 0) {
      await this.prisma.testInstanceSection.updateMany({
        where: { id: { in: previousSectionIds } },
        data: { status: "LOCKED" },
      });
    }

    // 7. Activate next section
    await this.prisma.testInstanceSection.update({
      where: { id: nextSection.id },
      data: {
        status: "ACTIVE",
        startedAt: now,
      },
    });

    // 8. Update ExecutionState with new section index and startedAt
    const lockedSectionKeys = sections
      .slice(0, nextSectionIndex)
      .map((s) => s.sectionKey);

    await this.prisma.executionState.upsert({
      where: { testInstanceId },
      update: {
        currentSectionIndex: nextSectionIndex,
        currentSectionKey: nextSection.sectionKey,
        sectionStartedAt: now,
        lockedSectionKeys: lockedSectionKeys,
        lastActivityAt: now,
      },
      create: {
        testInstanceId,
        currentQuestionIndex: 0,
        currentSectionIndex: nextSectionIndex,
        currentSectionKey: nextSection.sectionKey,
        sectionStartedAt: now,
        lockedSectionKeys: lockedSectionKeys,
        remainingTimeSeconds: 0,
        lastActivityAt: now,
      },
    });

    // 9. Also mark TestInstance as IN_PROGRESS (if CREATED)
    if (testInstance.status === "CREATED") {
      await this.prisma.testInstance.update({
        where: { id: testInstanceId },
        data: { status: "IN_PROGRESS", startedAt: now },
      });
    }

    this.logger.info(`Section advanced to index ${nextSectionIndex}`, {
      testInstanceId,
      nextSectionId: nextSection.id,
      sectionName: nextSection.sectionName,
    });

    return {
      nextSectionIndex,
      nextSectionId: nextSection.id,
      serverTime: now.toISOString(),
      isLastSection: false,
      submitted: false,
    };
  }
}
