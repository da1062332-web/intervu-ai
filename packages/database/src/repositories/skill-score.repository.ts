import { PrismaClient, SkillScore } from "@prisma/client";

// ─── Input Types ────────────────────────────────────────────────────────────────

export interface CreateSkillScoreInput {
  evaluationId: string;
  skill: string;
  score: number;
  feedback: string;
}

// ─── Repository ─────────────────────────────────────────────────────────────────

export class SkillScoreRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Batch-creates multiple skill scores atomically.
   * Uses Prisma's createMany for performance.
   */
  async createMany(data: CreateSkillScoreInput[]): Promise<{ count: number }> {
    return this.prisma.skillScore.createMany({
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
   * Results are ordered by skill name for consistent display.
   */
  async findByEvaluation(evaluationId: string): Promise<SkillScore[]> {
    return this.prisma.skillScore.findMany({
      where: { evaluationId },
      orderBy: { skill: "asc" },
    });
  }
}
