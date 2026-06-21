import { Injectable, Optional } from "@nestjs/common";
import { TemplatePreview, Prisma } from "@prisma/client";

import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class TemplatePreviewRepository extends BaseRepository<
  TemplatePreview,
  Prisma.TemplatePreviewCreateInput,
  Prisma.TemplatePreviewUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "templatePreview", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new TemplatePreviewRepository(this.prisma, tx) as this;
  }

  async findByTemplateId(templateId: string): Promise<TemplatePreview[]> {
    return this.db.templatePreview.findMany({
      where: { templateId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findLatestPreview(templateId: string): Promise<TemplatePreview | null> {
    return this.db.templatePreview.findFirst({
      where: { templateId },
      orderBy: { createdAt: "desc" },
    });
  }
}
