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
    const examConfigs = await this.prisma.examConfig.findMany({
      where: { isArchived: false, isActive: true, status: "PUBLISHED" },
      include: { sections: true },
    });

    return examConfigs.map((ec) => ({ ...ec, isExam: true }));
  }
}
