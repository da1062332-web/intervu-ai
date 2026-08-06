import { Injectable, Optional } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class CandidateResultRepository extends BaseRepository<
  any,
  Prisma.CandidateResultCreateInput,
  Prisma.CandidateResultUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "candidateResult", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new CandidateResultRepository(this.prisma, tx) as this;
  }

  async findResultByAttemptId(attemptId: string) {
    return this.db.candidateResult.findUnique({
      where: { attemptId },
      include: {
        attempt: {
          include: {
            testConfig: true,
            examConfig: true,
            user: true,
          },
        },
      },
    });
  }

  async findCandidateResults(
    candidateId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;
    const where = { candidateId };

    const [items, total] = await Promise.all([
      this.db.candidateResult.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          attempt: {
            include: { testConfig: true, examConfig: true },
          },
        },
      }),
      this.db.candidateResult.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findLatestResult(candidateId: string) {
    return this.db.candidateResult.findFirst({
      where: { candidateId },
      orderBy: { createdAt: "desc" },
      include: {
        attempt: {
          include: { testConfig: true, examConfig: true },
        },
      },
    });
  }

  async findAnalytics(attemptId: string) {
    return this.db.evaluationAnalytics.findUnique({
      where: { attemptId },
    });
  }

  async findRecommendations(attemptId: string) {
    const evaluation = await this.db.evaluationResult.findFirst({
      where: { testInstanceId: attemptId },
    });
    if (!evaluation) return [];
    return this.db.recommendation.findMany({
      where: { evaluationId: evaluation.id },
    });
  }

  async findDashboardData(candidateId: string) {
    return this.db.candidateResult.findMany({
      where: { candidateId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getEvaluationStatus(attemptId: string) {
    const state = await this.db.testInstance.findUnique({
      where: { id: attemptId },
      select: {
        status: true,
        candidateResult: { select: { id: true } },
        evaluationResult: { select: { id: true } },
      },
    });

    // Also check evaluation run
    const evalRun = await this.db.evaluationRun.findFirst({
      where: { attemptId },
      orderBy: { createdAt: "desc" },
    });

    return { state, evalRun };
  }
}
