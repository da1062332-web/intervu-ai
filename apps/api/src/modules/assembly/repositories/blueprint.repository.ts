import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class BlueprintRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getExamConfigForBlueprint(configId: string) {
    const config = await this.prisma.examConfig.findUnique({
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
      throw new NotFoundException(`Exam config ${configId} not found`);
    }

    return config;
  }
}
