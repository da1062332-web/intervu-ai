import { Injectable, Optional } from "@nestjs/common";
import { ReadinessReport, Prisma } from "@prisma/client";
import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class ReadinessReportRepository extends BaseRepository<
  ReadinessReport,
  Prisma.ReadinessReportCreateInput,
  Prisma.ReadinessReportUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "readinessReport", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new ReadinessReportRepository(this.prisma, tx) as this;
  }

  async findLatestByConfigId(
    configId: string,
  ): Promise<ReadinessReport | null> {
    return this.prisma.readinessReport.findFirst({
      where: { configId },
      orderBy: { createdAt: "desc" },
    });
  }
}
