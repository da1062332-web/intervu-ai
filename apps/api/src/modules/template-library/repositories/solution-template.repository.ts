import { Injectable, Optional } from "@nestjs/common";
import { SolutionTemplate, Prisma } from "@prisma/client";

import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class SolutionTemplateRepository extends BaseRepository<
  SolutionTemplate,
  Prisma.SolutionTemplateCreateInput,
  Prisma.SolutionTemplateUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "solutionTemplate", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new SolutionTemplateRepository(this.prisma, tx) as this;
  }

  async findByTemplateId(templateId: string): Promise<SolutionTemplate | null> {
    return this.db.solutionTemplate.findUnique({
      where: { templateId },
    });
  }
}
