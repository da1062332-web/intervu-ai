import { Injectable, Optional } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class RecommendationRepository extends BaseRepository<
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  any,
  Prisma.RecommendationCreateInput,
  Prisma.RecommendationUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "recommendation", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new RecommendationRepository(this.prisma, tx) as this;
  }

  async findByEvaluationId(evaluationId: string) {
    return this.db.recommendation.findMany({
      where: { evaluationId },
      orderBy: {
        createdAt: "asc", // or priority mapping handled in service
      },
    });
  }
}
