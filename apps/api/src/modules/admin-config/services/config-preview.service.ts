import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

export interface ConfigPreviewResponse {
  configId: string;
  name: string;
  role: string;
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
  constructor(private readonly prisma: PrismaService) {}

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

    const difficultyValid =
      difficulty.easy + difficulty.medium + difficulty.hard === 100;

    const isReadyToPublish =
      config.sections.length > 0 &&
      config.totalQuestions > 0 &&
      config.durationMinutes > 0 &&
      difficultyValid &&
      !config.isArchived;

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
    if (uniqueConceptCodes.size > 0) {
      totalTemplates = await this.prisma.template.count({
        where: {
          isActive: true,
          deletedAt: null,
          conceptKey: { in: Array.from(uniqueConceptCodes) },
        },
      });
    }

    return {
      configId: config.id,
      name: config.name,
      role: config.role,
      durationMinutes: config.durationMinutes,
      sections: config.sections.length,
      questions: config.totalQuestions,
      difficulty,
      sectionBreakdown,
      totalTopics,
      totalTemplates,
      conceptCodes: Array.from(uniqueConceptCodes),
      isReadyToPublish,
    };
  }
}
