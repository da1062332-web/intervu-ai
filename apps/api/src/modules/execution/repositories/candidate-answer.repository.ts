import { Injectable, Optional } from "@nestjs/common";
import { CandidateAnswer, Prisma } from "@prisma/client";

import { BaseRepository } from "../../../common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class CandidateAnswerRepository extends BaseRepository<
  CandidateAnswer,
  Prisma.CandidateAnswerCreateInput,
  Prisma.CandidateAnswerUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "candidateAnswer", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new CandidateAnswerRepository(this.prisma, tx) as this;
  }
}
