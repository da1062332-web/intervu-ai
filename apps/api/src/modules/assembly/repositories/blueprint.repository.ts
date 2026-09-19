import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class BlueprintRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getExamConfigForBlueprint(configId: string) {
    let config: any = await this.prisma.examConfig.findUnique({
      where: { id: configId },
      include: {
        difficultyDistribution: true,
        sections: {
          include: {
            sectionTopics: {
              include: {
                topicWeightage: true,
              },
            },
          },
          orderBy: {
            sectionOrder: "asc",
          },
        },
      },
    });

    if (!config) {
      config = await this.prisma.examConfig.findFirst({
        where: { code: configId },
        include: {
          difficultyDistribution: true,
          sections: {
            include: {
              sectionTopics: {
                include: {
                  topicWeightage: true,
                },
              },
            },
            orderBy: {
              sectionOrder: "asc",
            },
          },
        },
      });
    }

    if (!config) {
      const testConfig = await this.prisma.testConfig.findFirst({
        where: { OR: [{ id: configId }, { configKey: configId }] },
        include: {
          sections: {
            orderBy: {
              orderIndex: "asc",
            },
          },
        },
      });
      if (testConfig) {
        return {
          id: testConfig.id,
          name: testConfig.displayName,
          code: testConfig.configKey,
          difficultyDistribution: {
            easyPercentage: 34,
            mediumPercentage: 33,
            hardPercentage: 33,
          },
          sections: testConfig.sections.map((s, idx) => ({
            id: s.id,
            name: s.displayName,
            code: s.sectionKey || `section_${idx + 1}`,
            sectionOrder: s.orderIndex ?? idx,
            sectionDurationMinutes: Math.max(1, Math.ceil(s.durationSeconds / 60)) || 15,
            questionCount: s.questionCount || 5,
            sectionTopics: [
              {
                topicId: s.sectionKey || `topic_${idx + 1}`,
                topicWeightage: {
                  weightagePercentage: 100,
                },
              },
            ],
          })),
        };
      }
    }

    if (!config) {
      throw new NotFoundException(`Exam config ${configId} not found`);
    }

    return config;
  }
}
