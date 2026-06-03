import { Injectable } from '@nestjs/common';
import { Template, Prisma, DifficultyLevel } from '@prisma/client';

import { BaseRepository } from '../../../common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TemplateRepository extends BaseRepository<
  Template,
  Prisma.TemplateCreateInput,
  Prisma.TemplateUpdateInput
> {
  constructor(
    prisma: PrismaService,
    tx?: Prisma.TransactionClient,
  ) {
    super(prisma, 'template', { softDelete: true }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new TemplateRepository(this.prisma, tx) as this;
  }

  async findSystemTemplates(): Promise<Template[]> {
    const where: Prisma.TemplateWhereInput = { isSystem: true };
    if (this.options.softDelete) {
      where.deletedAt = null;
    }
    return this.db.template.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDifficulty(difficulty: DifficultyLevel): Promise<Template[]> {
    const where: Prisma.TemplateWhereInput = { difficulty };
    if (this.options.softDelete) {
      where.deletedAt = null;
    }
    return this.db.template.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
