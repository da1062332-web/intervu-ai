import { Injectable, NotFoundException } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { TestInstanceRepository } from "../repositories";
import { ExecutionValidatorService } from "./execution-validator.service";

export type SectionStatus = "UPCOMING" | "ACTIVE" | "COMPLETED" | "EXPIRED" | "LOCKED";

export interface SectionSnapshot {
  sectionId: string;
  sectionKey: string;
  sectionName: string;
  durationSeconds: number;
  status: SectionStatus;
  startedAt: string | null;
  questions: Array<{
    questionId: string;
    questionOrder: number;
    snapshot: unknown;
  }>;
}

export interface AssessmentSnapshotResponse {
  testInstanceId: string;
  testConfigId: string | null;
  status: string;
  expiresAt: Date | null;
  sectionTimingEnabled: boolean;
  currentSectionIndex: number;
  serverTime: string;
  sections: SectionSnapshot[];
}

@Injectable()
export class ExecutionService {
  private readonly logger = new AppLogger({ name: "ExecutionService" });

  constructor(
    private readonly prisma: PrismaService,
    private readonly testInstanceRepo: TestInstanceRepository,
    private readonly validator: ExecutionValidatorService,
  ) {}

  async loadAssessment(
    testInstanceId: string,
    userId: string,
  ): Promise<AssessmentSnapshotResponse> {
    this.logger.debug("Loading assessment snapshot", {
      testInstanceId,
      userId,
    });
    // 1. Validate assessment exists
    const testInstance =
      await this.validator.validateAssessment(testInstanceId);

    // 2. Validate ownership
    this.validator.validateOwnership(testInstance, userId);

    // 3. Load full snapshot (sections, questions)
    const snapshot =
      await this.testInstanceRepo.loadDeepSnapshot(testInstanceId);

    if (!snapshot) {
      throw new NotFoundException("Assessment snapshot could not be loaded");
    }

    // 4. Determine sectionTimingEnabled from ExamConfig -> RuleFlags
    let sectionTimingEnabled = false;
    if ((testInstance as any).examConfigId) {
      const examConfig = await this.prisma.examConfig.findUnique({
        where: { id: (testInstance as any).examConfigId },
        include: { ruleFlags: true },
      });
      sectionTimingEnabled = examConfig?.ruleFlags?.sectionTimingEnabled ?? false;
    }

    // 5. Load execution state for current section index
    const executionState = await this.prisma.executionState.findUnique({
      where: { testInstanceId },
    });
    const currentSectionIndex = executionState?.currentSectionIndex ?? 0;

    // 6. Build sections with status derived from TestInstanceSection.status
    const sectionsWithStatus = snapshot.sections.map(
      (section: {
        id: string;
        sectionKey: string;
        sectionName: string;
        durationSeconds: number;
        status?: string;
        startedAt?: Date | null;
        questions: Array<{
          questionId: string;
          questionOrder: number;
          questionSnapshot: unknown;
        }>;
      }): SectionSnapshot => {
        const rawStatus = (section.status as string) || "UPCOMING";
        const status = this._normalizeSectionStatus(rawStatus);

        return {
          sectionId: section.id,
          sectionKey: section.sectionKey,
          sectionName: section.sectionName,
          durationSeconds: section.durationSeconds,
          status,
          startedAt: section.startedAt ? section.startedAt.toISOString() : null,
          questions: section.questions.map((q) => {
            const rawSnapshot = (q.questionSnapshot || {}) as any;
            const { correctAnswer, solution, ...candidateSafeSnapshot } = rawSnapshot;
            return {
              questionId: q.questionId,
              questionOrder: q.questionOrder,
              snapshot: candidateSafeSnapshot,
            };
          }),
        };
      },
    );

    return {
      testInstanceId: snapshot.id,
      testConfigId: snapshot.testConfigId,
      status: snapshot.status,
      expiresAt: snapshot.expiresAt,
      sectionTimingEnabled,
      currentSectionIndex,
      serverTime: new Date().toISOString(),
      sections: sectionsWithStatus,
    };
  }

  private _normalizeSectionStatus(raw: string): SectionStatus {
    const valid: SectionStatus[] = ["UPCOMING", "ACTIVE", "COMPLETED", "EXPIRED", "LOCKED"];
    const upper = raw.toUpperCase() as SectionStatus;
    return valid.includes(upper) ? upper : "UPCOMING";
  }
}
