import { Injectable, Optional } from "@nestjs/common";
import { ExamSection, Prisma } from "@prisma/client";
import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class ExamSectionRepository extends BaseRepository<
  ExamSection,
  Prisma.ExamSectionCreateInput,
  Prisma.ExamSectionUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "examSection", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new ExamSectionRepository(this.prisma, tx) as this;
  }

  async findByConfigAndOrder(examConfigId: string, sectionOrder: number) {
    return this.prisma.examSection.findFirst({
      where: { examConfigId, sectionOrder },
    });
  }

  async findByConfigAndCode(examConfigId: string, code: string) {
    return this.prisma.examSection.findFirst({
      where: { examConfigId, code },
    });
  }

  async findManyByConfigId(examConfigId: string) {
    return this.prisma.examSection.findMany({
      where: { examConfigId },
      orderBy: { sectionOrder: "asc" },
    });
  }
}
