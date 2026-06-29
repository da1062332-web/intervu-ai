import { Injectable } from "@nestjs/common";
import { Template } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class TestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all non-soft-deleted templates ordered by creation date descending.
   * Repository layer only — no formatting, no business logic.
   */
  async findAllActiveConfigs(): Promise<any[]> {
    return this.prisma.testConfig.findMany({
      where: { isActive: true },
      include: { sections: true },
      orderBy: { displayName: "asc" },
    });
  }
}
