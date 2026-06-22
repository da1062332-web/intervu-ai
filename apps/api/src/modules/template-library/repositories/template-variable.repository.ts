import { Injectable, Optional } from "@nestjs/common";
import { TemplateVariable, Prisma } from "@prisma/client";

import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class TemplateVariableRepository extends BaseRepository<
  TemplateVariable,
  Prisma.TemplateVariableCreateInput,
  Prisma.TemplateVariableUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "templateVariable", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new TemplateVariableRepository(this.prisma, tx) as this;
  }
}
