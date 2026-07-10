import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class TestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all non-soft-deleted templates ordered by creation date descending.
   * Repository layer only — no formatting, no business logic.
   */

  async findAllActiveConfigs(): Promise<any[]> {
    const testConfigs = await this.prisma.testConfig.findMany({
      where: { isActive: true },
      include: { sections: true },
      orderBy: { displayName: "asc" },
    });
    const examConfigs = await this.prisma.examConfig.findMany({
      where: { isActive: true },
      include: { sections: true },
    });
    
    return [
      ...testConfigs.map((tc) => ({ ...tc, isExam: false })),
      ...examConfigs.map((ec) => ({ ...ec, isExam: true })),
    ];
  }
}
