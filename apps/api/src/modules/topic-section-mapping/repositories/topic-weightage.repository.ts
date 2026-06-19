import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class TopicWeightageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWeightage(
    sectionId: string,
    topicId: string,
    weightagePercentage: number,
  ) {
    return this.prisma.topicWeightage.create({
      data: {
        sectionId,
        topicId,
        weightagePercentage,
      },
    });
  }

  async findWeightageById(id: string) {
    return this.prisma.topicWeightage.findUnique({
      where: { id },
    });
  }

  async findWeightagesBySection(sectionId: string) {
    return this.prisma.topicWeightage.findMany({
      where: { sectionId },
      orderBy: { createdAt: "asc" },
    });
  }

  async findWeightageBySectionAndTopic(sectionId: string, topicId: string) {
    return this.prisma.topicWeightage.findUnique({
      where: {
        sectionId_topicId: { sectionId, topicId },
      },
    });
  }

  async updateWeightage(id: string, weightagePercentage: number) {
    return this.prisma.topicWeightage.update({
      where: { id },
      data: { weightagePercentage },
    });
  }

  async deleteWeightage(id: string) {
    return this.prisma.topicWeightage.delete({
      where: { id },
    });
  }

  async sumWeightagesBySection(sectionId: string): Promise<number> {
    const aggregate = await this.prisma.topicWeightage.aggregate({
      where: { sectionId },
      _sum: {
        weightagePercentage: true,
      },
    });
    return aggregate._sum.weightagePercentage || 0;
  }
}
