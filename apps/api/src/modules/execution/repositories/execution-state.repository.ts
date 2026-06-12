import { Injectable, Optional } from "@nestjs/common";
import { ExecutionState, Prisma } from "@prisma/client";

import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class ExecutionStateRepository extends BaseRepository<
  ExecutionState,
  Prisma.ExecutionStateCreateInput,
  Prisma.ExecutionStateUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "executionState", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new ExecutionStateRepository(this.prisma, tx) as this;
  }
}
