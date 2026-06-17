import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { UpdateRuleFlags } from "@intervu/shared";

@Injectable()
export class RuleFlagsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByConfigId(examConfigId: string) {
    return this.prisma.examRuleFlags.findUnique({
      where: { examConfigId },
    });
  }

  async upsert(examConfigId: string, data: UpdateRuleFlags) {
    return this.prisma.examRuleFlags.upsert({
      where: { examConfigId },
      update: data,
      create: {
        examConfigId,
        ...data,
      },
    });
  }

  async update(examConfigId: string, data: UpdateRuleFlags) {
    return this.prisma.examRuleFlags.update({
      where: { examConfigId },
      data,
    });
  }

  async checkConfigExists(examConfigId: string): Promise<boolean> {
    const count = await this.prisma.examConfig.count({
      where: { id: examConfigId },
    });
    return count > 0;
  }
}
