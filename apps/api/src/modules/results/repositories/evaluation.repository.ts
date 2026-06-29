import { Injectable, Optional } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import { PaginationDto } from "@intervu/shared";

@Injectable()
export class EvaluationRepository extends BaseRepository<
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  any, // We use any because BaseRepository assumes { id: string; deletedAt?: Date | null } but EvaluationResult doesn't have deletedAt
  Prisma.EvaluationResultCreateInput,
  Prisma.EvaluationResultUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "evaluationResult", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new EvaluationRepository(this.prisma, tx) as this;
  }

  async findEvaluationWithDetails(evaluationId: string) {
    return this.model
      .findUnique({
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        where: { id: evaluationId } as any,
      })
      .then(async (result) => {
        if (!result) return null;
        // Since BaseRepository's findUnique doesn't support includes, we use db directly
        return this.db.evaluationResult.findUnique({
          where: { id: evaluationId },
          include: {
            skillScores: true,
          },
        });
      });
  }

  async findByUserIdPaginated(
    userId: string,
    paginationOptions: PaginationDto,
  ) {
    const page =
      paginationOptions.page && paginationOptions.page > 0
        ? Math.floor(paginationOptions.page)
        : 1;
    const limit =
      paginationOptions.limit && paginationOptions.limit > 0
        ? Math.floor(paginationOptions.limit)
        : 10;
    const skip = (page - 1) * limit;

    const where = { userId };

    const [items, total] = await Promise.all([
      this.db.evaluationResult.findMany({
        where,
        orderBy: { evaluatedAt: "desc" },
        take: limit,
        skip,
      }),
      this.db.evaluationResult.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async findLastActivity(): Promise<Date | null> {
    const last = await this.prisma.evaluationResult.findFirst({
      orderBy: { evaluatedAt: "desc" },
      select: { evaluatedAt: true },
    });
    return last?.evaluatedAt || null;
  }
}
