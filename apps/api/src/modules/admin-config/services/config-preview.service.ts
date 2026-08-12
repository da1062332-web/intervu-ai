import { Injectable, Optional } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ExamConfigReadinessService } from "./exam-config-readiness.service";

export interface ConfigPreviewResponse {
  configId: string;
  name: string;
  role: string;
  status: string;
  readinessScore: number;
  readinessStatus: string;
  durationMinutes: number;
  sections: number;
  questions: number;
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  sectionBreakdown: Array<{
    name: string;
    code: string;
    questionCount: number;
    durationMinutes: number;
    topicCount: number;
  }>;
  totalTopics: number;
  totalTemplates: number;
  totalManualQuestions?: number;
  conceptCodes: string[];
  isReadyToPublish: boolean;
}

/**
 * Task Group 5 — Config Preview Engine
 *
 * Provides downstream impact preview without mutating state.
 * Used by Module 2, 3, 4 consumers.
 */
@Injectable()
export class ConfigPreviewService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    private readonly readinessService?: ExamConfigReadinessService,
  ) {}

  async getPreview(configId: string): Promise<ConfigPreviewResponse> {
    const config = await this.prisma.examConfig.findUniqueOrThrow({
      where: { id: configId },
      include: {
        sections: {
          include: {
            sectionTopics: {
              include: {
                topic: {
                  include: {
                    concepts: true,
                  },
                },
              },
            },
          },
          orderBy: { sectionOrder: "asc" },
        },
        difficultyDistribution: true,
      },
    });

    let readinessScore = 100;
    let readinessStatus = "READY";

    if (this.readinessService) {
      try {
        const readinessRes =
          await this.readinessService.checkReadiness(configId);
        readinessScore = readinessRes.score;
        readinessStatus = readinessRes.status;
      } catch (err) {
        console.warn(
          `ConfigPreviewService: checkReadiness fallback for ${configId}:`,
          err,
        );
      }
    }

    const sectionBreakdown = config.sections.map((section) => ({
      name: section.name,
      code: section.code,
      questionCount: section.questionCount,
      durationMinutes: section.sectionDurationMinutes,
      topicCount: section.sectionTopics.length,
    }));

    const difficulty = {
      easy: config.difficultyDistribution?.easyPercentage ?? 0,
      medium: config.difficultyDistribution?.mediumPercentage ?? 0,
      hard: config.difficultyDistribution?.hardPercentage ?? 0,
    };

    const totalPct = difficulty.easy + difficulty.medium + difficulty.hard;
    const difficultyValid = totalPct === 100 || totalPct === 0;

    const isReadyToPublish =
      config.sections.length > 0 &&
      config.totalQuestions > 0 &&
      config.durationMinutes > 0 &&
      difficultyValid &&
      readinessScore === 100 &&
      !config.isArchived;

    let computedStatus: string = config.status;
    if (config.isArchived || config.status === "ARCHIVED") {
      computedStatus = "ARCHIVED";
    } else if (
      !difficultyValid ||
      config.sections.length === 0 ||
      config.totalQuestions <= 0 ||
      config.durationMinutes <= 0
    ) {
      computedStatus = "INVALID";
    } else if (readinessScore < 100) {
      computedStatus = "INCOMPLETE_POOL_UNDERSTOCKED";
    } else if (
      isReadyToPublish &&
      (config.status === "PUBLISHED" || config.status === "VALIDATED")
    ) {
      computedStatus = "READY_TO_ASSEMBLE";
    } else if (config.status === "DRAFT") {
      computedStatus = "DRAFT_UNVALIDATED";
    }

    // Calculate unique topics and templates
    const uniqueTopics = new Set<string>();
    const uniqueConceptCodes = new Set<string>();

    config.sections.forEach((section) => {
      section.sectionTopics.forEach((st) => {
        if (st.topic) {
          uniqueTopics.add(st.topic.id);
          st.topic.concepts?.forEach((c) => {
            if (c.code) uniqueConceptCodes.add(c.code);
          });
        }
      });
    });

    const totalTopics = uniqueTopics.size;

    let totalTemplates = 0;
    let totalManualQuestions = 0;
    if (uniqueConceptCodes.size > 0) {
      totalTemplates = await this.prisma.template.count({
        where: {
          isActive: true,
          deletedAt: null,
          conceptKey: { in: Array.from(uniqueConceptCodes) },
        },
      });

      const concepts = await this.prisma.concept.findMany({
        where: {
          code: { in: Array.from(uniqueConceptCodes) },
        },
      });
      const conceptIds = concepts.map((c: any) => c.id);

      totalManualQuestions = await this.prisma.question.count({
        where: {
          status: "ACTIVE",
          OR: [
            { conceptId: { in: conceptIds } },
            { topicId: { in: Array.from(uniqueTopics) } },
          ],
        },
      });
    }

    return {
      configId: config.id,
      name: config.name,
      role: config.role,
      status: computedStatus,
      readinessScore,
      readinessStatus,
      durationMinutes: config.durationMinutes,
      sections: config.sections.length,
      questions: config.totalQuestions,
      difficulty,
      sectionBreakdown,
      totalTopics,
      totalTemplates,
      totalManualQuestions,
      conceptCodes: Array.from(uniqueConceptCodes),
      isReadyToPublish,
    };
  }
}
