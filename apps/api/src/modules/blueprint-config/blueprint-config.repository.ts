import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class BlueprintConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.BlueprintConfigCreateInput) {
    return this.prisma.blueprintConfig.create({
      data,
    });
  }

  findAll() {
    return this.prisma.blueprintConfig.findMany({
      where: { deletedAt: null },
      include: {
        topicConfigs: true,
      },
    });
  }

  findById(id: string) {
    return this.prisma.blueprintConfig.findFirst({
      where: { id, deletedAt: null },
      include: {
        topicConfigs: {
          include: {
            topic: true,
            examSection: true,
          },
        },
      },
    });
  }

  findByCode(code: string) {
    return this.prisma.blueprintConfig.findFirst({
      where: { code, deletedAt: null },
    });
  }

  update(id: string, data: Prisma.BlueprintConfigUpdateInput) {
    return this.prisma.blueprintConfig.update({
      where: { id },
      data,
    });
  }

  softDelete(id: string) {
    return this.prisma.blueprintConfig.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  addTopicConfig(data: Prisma.BlueprintTopicConfigCreateInput) {
    return this.prisma.blueprintTopicConfig.create({
      data,
    });
  }

  findTopicConfigs(blueprintId: string) {
    return this.prisma.blueprintTopicConfig.findMany({
      where: { blueprintId },
      include: {
        topic: true,
        examSection: true,
      },
    });
  }
}
