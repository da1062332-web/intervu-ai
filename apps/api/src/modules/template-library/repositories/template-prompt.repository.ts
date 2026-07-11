import { Injectable, Optional } from "@nestjs/common";
import { TemplatePromptConfig, Prisma } from "@prisma/client";

import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class TemplatePromptRepository extends BaseRepository<
  TemplatePromptConfig,
  Prisma.TemplatePromptConfigCreateInput,
  Prisma.TemplatePromptConfigUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "templatePromptConfig", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new TemplatePromptRepository(this.prisma, tx) as this;
  }

  async findByTemplateId(
    templateId: string,
  ): Promise<TemplatePromptConfig | null> {
    return this.db.templatePromptConfig.findUnique({
      where: { templateId },
    });
  }
}
