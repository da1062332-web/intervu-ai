import { PrismaClient, SkillScore, Prisma } from "@prisma/client";

export interface CreateSkillScoreInput {
  evaluationId: string;
  skill: string;
  score: number;
  feedback: string;
}

export class SkillScoreRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Batch-creates multiple skill scores atomically.
   */
  async createMany(
    data: CreateSkillScoreInput[],
    tx?: Prisma.TransactionClient,
  ): Promise<{ count: number }> {
    const client = tx || this.prisma;
    return client.skillScore.createMany({
      data: data.map((s) => ({
        evaluationId: s.evaluationId,
        skill: s.skill,
        score: s.score,
        feedback: s.feedback,
      })),
    });
  }

  /**
   * Retrieves all skill scores for a given evaluation.
   */
  async findByEvaluation(
    evaluationId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SkillScore[]> {
    const client = tx || this.prisma;
    return client.skillScore.findMany({
      where: { evaluationId },
      orderBy: { skill: "asc" },
    });
  }

  /**
   * Retrieves all skill scores for a specific skill.
   */
  async findBySkill(
    skill: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SkillScore[]> {
    const client = tx || this.prisma;
    return client.skillScore.findMany({
      where: { skill },
      orderBy: { score: "desc" },
    });
  }
}
