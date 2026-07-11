import { Injectable, Optional } from "@nestjs/common";
import { TemplateDatasetConfig, Prisma } from "@prisma/client";

import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class TemplateDatasetRepository extends BaseRepository<
  TemplateDatasetConfig,
  Prisma.TemplateDatasetConfigCreateInput,
  Prisma.TemplateDatasetConfigUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "templateDatasetConfig", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new TemplateDatasetRepository(this.prisma, tx) as this;
  }

  async findByTemplateId(
    templateId: string,
  ): Promise<TemplateDatasetConfig | null> {
    return this.db.templateDatasetConfig.findUnique({
      where: { templateId },
    });
  }
}
