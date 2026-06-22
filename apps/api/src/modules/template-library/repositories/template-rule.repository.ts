import { Injectable, Optional } from "@nestjs/common";
import { TemplateRule, Prisma } from "@prisma/client";

import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class TemplateRuleRepository extends BaseRepository<
  TemplateRule,
  Prisma.TemplateRuleCreateInput,
  Prisma.TemplateRuleUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "templateRule", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new TemplateRuleRepository(this.prisma, tx) as this;
  }
}
