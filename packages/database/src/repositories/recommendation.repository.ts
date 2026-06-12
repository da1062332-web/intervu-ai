import { PrismaClient, Recommendation, RecommendationPriority, Prisma } from "@prisma/client";

export interface CreateRecommendationInput {
  evaluationId: string;
  skill: string;
  priority: RecommendationPriority;
  title: string;
  description: string;
}

export class RecommendationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createMany(
    data: CreateRecommendationInput[],
    tx?: Prisma.TransactionClient
  ): Promise<{ count: number }> {
    const client = tx || this.prisma;
    return await client.recommendation.createMany({
      data: data.map((r) => ({
        evaluationId: r.evaluationId,
        skill: r.skill,
        priority: r.priority,
        title: r.title,
        description: r.description,
      })),
    });
  }

  async findByEvaluation(
    evaluationId: string,
    tx?: Prisma.TransactionClient
  ): Promise<Recommendation[]> {
    const client = tx || this.prisma;
    return await client.recommendation.findMany({
      where: { evaluationId },
      orderBy: { priority: "asc" }, // High first if we map correctly or by creation order
    });
  }

  async findHighPriority(
    limit: number = 5,
    tx?: Prisma.TransactionClient
  ): Promise<Recommendation[]> {
    const client = tx || this.prisma;
    return await client.recommendation.findMany({
      where: { priority: RecommendationPriority.HIGH },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }
}
