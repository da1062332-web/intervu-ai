import { Injectable, Optional } from "@nestjs/common";
import { Submission, Prisma } from "@prisma/client";

import { BaseRepository } from "../../../common/repositories/base.repository";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class SubmissionRepository extends BaseRepository<
  Submission,
  Prisma.SubmissionCreateInput,
  Prisma.SubmissionUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "submission", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new SubmissionRepository(this.prisma, tx) as this;
  }
}
