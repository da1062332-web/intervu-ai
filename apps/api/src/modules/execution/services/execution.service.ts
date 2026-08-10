import { Injectable, NotFoundException } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { TestInstanceRepository } from "../repositories";
import { ExecutionValidatorService } from "./execution-validator.service";

export type SectionStatus =
  | "UPCOMING"
  | "ACTIVE"
  | "COMPLETED"
  | "EXPIRED"
  | "LOCKED";

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
  currentQuestionIndex: number;
  serverTime: string;
  candidateName?: string;
  assessmentName?: string;
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
      sectionTimingEnabled =
        examConfig?.ruleFlags?.sectionTimingEnabled ?? false;
    }

    // 5. Load execution state for current section index
    const executionState = await this.prisma.executionState.findUnique({
      where: { testInstanceId },
    });
    const currentSectionIndex =
      (executionState as any)?.currentSectionIndex ?? 0;
    const currentQuestionIndex = executionState?.currentQuestionIndex ?? 0;

    // 5a. Fetch templates to dynamically inject stem and instructions if toggled on
    const templateIds = new Set<string>();
    const questionIds = new Set<string>();
    for (const section of snapshot.sections) {
      for (const q of section.questions) {
        const rawSnapshot = (q.questionSnapshot || {}) as any;
        if (rawSnapshot.templateId) {
          templateIds.add(rawSnapshot.templateId);
        }
        if (q.questionId) {
          questionIds.add(q.questionId);
        }
      }
    }

    // Fallback to fetch templateId and mcqData from Question model if missing in snapshot
    const questionTemplateMap = new Map<string, string>();
    const questionMcqDataMap = new Map<string, any>();
    const questionMetaMap = new Map<string, any>();
    if (questionIds.size > 0) {
      const dbQuestions = await this.prisma.question.findMany({
        where: { id: { in: Array.from(questionIds) } },
        select: {
          id: true,
          templateId: true,
          mcqData: true,
          metadata: true,
          questionStatement: true,
          instructions: true,
        },
      });
      for (const q of dbQuestions) {
        if (q.templateId) {
          questionTemplateMap.set(q.id, q.templateId);
          templateIds.add(q.templateId);
        }
        if (q.mcqData) {
          questionMcqDataMap.set(q.id, q.mcqData);
        }
        questionMetaMap.set(q.id, {
          questionStatement: q.questionStatement,
          instructions: q.instructions,
        });
      }
    }

    const templates = await this.prisma.template.findMany({
      where: { id: { in: Array.from(templateIds) } },
      select: { id: true, structure: true },
    });

    const templateMap = new Map<string, any>();
    for (const t of templates) {
      templateMap.set(t.id, t.structure);
    }

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
            const { correctAnswer, solution, ...candidateSafeSnapshot } =
              rawSnapshot;

            // Enrich options from mcqData if snapshot has incomplete/missing options (< 4)
            const snapshotOptions = candidateSafeSnapshot.options;
            const hasFullOptions =
              Array.isArray(snapshotOptions) && snapshotOptions.length >= 4;
            if (!hasFullOptions && questionMcqDataMap.has(q.questionId)) {
              const mcqData = questionMcqDataMap.get(q.questionId) as any;
              const mcqOptions = mcqData?.options;
              if (Array.isArray(mcqOptions) && mcqOptions.length >= 4) {
                candidateSafeSnapshot.options = mcqOptions;
              }
            }

            // Enrich questionStatement and instructions from Question table if missing
            if (
              !candidateSafeSnapshot.questionStatement &&
              questionMetaMap.has(q.questionId)
            ) {
              const meta = questionMetaMap.get(q.questionId);
              if (meta?.questionStatement)
                candidateSafeSnapshot.questionStatement =
                  meta.questionStatement;
              if (meta?.instructions)
                candidateSafeSnapshot.instructions = meta.instructions;
            }

            const templateId =
              rawSnapshot.templateId || questionTemplateMap.get(q.questionId);
            if (templateId && templateMap.has(templateId)) {
              const structure = templateMap.get(templateId) as any;
              if (structure && structure.questionTemplate) {
                try {
                  const qt =
                    typeof structure.questionTemplate === "string"
                      ? JSON.parse(structure.questionTemplate)
                      : structure.questionTemplate;
                  if (qt.showStem !== false && qt.stem) {
                    candidateSafeSnapshot.questionStatement = qt.stem;
                  }
                  if (qt.showInstructions !== false && qt.instructions) {
                    candidateSafeSnapshot.instructions = qt.instructions;
                  }
                } catch (e) {
                  // ignore parse error
                }
              }
            }

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
      currentQuestionIndex,
      serverTime: new Date().toISOString(),
      candidateName: snapshot.user?.name || snapshot.user?.email || "Candidate",
      assessmentName:
        snapshot.examConfig?.name ||
        snapshot.testConfig?.name ||
        "Candidate Assessment",
      sections: sectionsWithStatus,
    };
  }

  private _normalizeSectionStatus(raw: string): SectionStatus {
    const valid: SectionStatus[] = [
      "UPCOMING",
      "ACTIVE",
      "COMPLETED",
      "EXPIRED",
      "LOCKED",
    ];
    const upper = raw.toUpperCase() as SectionStatus;
    return valid.includes(upper) ? upper : "UPCOMING";
  }
}
