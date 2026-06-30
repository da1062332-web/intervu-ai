import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class TestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all non-soft-deleted templates ordered by creation date descending.
   * Repository layer only — no formatting, no business logic.
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  async findAllActiveConfigs(): Promise<any[]> {
    return this.prisma.testConfig.findMany({
      where: { isActive: true },
      include: { sections: true },
      orderBy: { displayName: "asc" },
    });
  }
}
