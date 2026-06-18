import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class TopicSectionMappingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMapping(sectionId: string, topicId: string) {
    return this.prisma.sectionTopic.create({
      data: { sectionId, topicId },
    });
  }

  async removeMapping(sectionId: string, topicId: string) {
    return this.prisma.sectionTopic.delete({
      where: {
        sectionId_topicId: { sectionId, topicId },
      },
    });
  }

  async findMappingsBySection(sectionId: string) {
    return this.prisma.sectionTopic.findMany({
      where: { sectionId },
      orderBy: { createdAt: "asc" },
    });
  }

  async findMapping(sectionId: string, topicId: string) {
    return this.prisma.sectionTopic.findUnique({
      where: {
        sectionId_topicId: { sectionId, topicId },
      },
    });
  }

  async exists(sectionId: string, topicId: string): Promise<boolean> {
    const count = await this.prisma.sectionTopic.count({
      where: { sectionId, topicId },
    });
    return count > 0;
  }
}
