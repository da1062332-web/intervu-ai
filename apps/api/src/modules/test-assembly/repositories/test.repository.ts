import { Injectable, Optional } from '@nestjs/common';
import { Test, Prisma, TestStatus } from '@prisma/client';

import { BaseRepository } from '../../../common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TestRepository extends BaseRepository<
  Test,
  Prisma.TestCreateInput,
  Prisma.TestUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, 'test', { softDelete: true }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new TestRepository(this.prisma, tx) as this;
  }

  async findActiveTestsByUserId(userId: string): Promise<Test[]> {
    const where: Prisma.TestWhereInput = {
      userId,
      status: TestStatus.ONGOING,
    };
    if (this.options.softDelete) {
      where.deletedAt = null;
    }
    return this.db.test.findMany({
      where,
      include: { template: true },
      orderBy: { startedAt: 'desc' },
    });
  }

  async findTestsByStatus(status: TestStatus): Promise<Test[]> {
    const where: Prisma.TestWhereInput = { status };
    if (this.options.softDelete) {
      where.deletedAt = null;
    }
    return this.db.test.findMany({
      where,
      include: { template: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCompletedTestsByUserId(userId: string): Promise<Test[]> {
    const where: Prisma.TestWhereInput = {
      userId,
      status: TestStatus.COMPLETED,
    };
    if (this.options.softDelete) {
      where.deletedAt = null;
    }
    return this.db.test.findMany({
      where,
      include: { template: true },
      orderBy: { completedAt: 'desc' },
    });
  }
}
