import { Injectable, Optional } from "@nestjs/common";
import { TestInstance, Prisma } from "@prisma/client";

import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class TestInstanceRepository extends BaseRepository<
  TestInstance,
  Prisma.TestInstanceCreateInput,
  Prisma.TestInstanceUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "testInstance", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new TestInstanceRepository(this.prisma, tx) as this;
  }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  async loadDeepSnapshot(id: string): Promise<any> {
    return this.db.testInstance.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            questions: {
              orderBy: { questionOrder: 'asc' }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });
  }
}
