import { Injectable, Optional } from "@nestjs/common";
import { ExamConfig, Prisma } from "@prisma/client";
import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class ExamConfigRepository extends BaseRepository<
  ExamConfig,
  Prisma.ExamConfigCreateInput,
  Prisma.ExamConfigUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "examConfig", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new ExamConfigRepository(this.prisma, tx) as this;
  }

  async findByCode(code: string) {
    return this.prisma.examConfig.findUnique({
      where: { code },
    });
  }
}
