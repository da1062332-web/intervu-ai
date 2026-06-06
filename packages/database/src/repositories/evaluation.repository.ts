import { PrismaClient, EvaluationResult, Prisma } from "@prisma/client";

// ─── Input Types ────────────────────────────────────────────────────────────────

export interface CreateEvaluationInput {
  testId: string;
  candidateId: string;
  overallScore: number;
  confidenceScore: number;
  communicationScore?: number;
  technicalScore?: number;
  overallRating?: number;
  notes?: string;
  skillScores?: {
    skill: string;
    score: number;
    feedback: string;
  }[];
}

export interface UpdateEvaluationInput {
  overallScore?: number;
  confidenceScore?: number;
  communicationScore?: number;
  technicalScore?: number;
  overallRating?: number;
  notes?: string;
}

// ─── Evaluation Result with SkillScores included ────────────────────────────────

type EvaluationWithSkillScores = Prisma.EvaluationResultGetPayload<{
  include: { skillScores: true };
}>;

// ─── Repository ─────────────────────────────────────────────────────────────────

export class EvaluationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Creates an evaluation result, optionally with nested skill scores.
   * Uses Prisma's nested create for atomic insertion.
   */
  async createEvaluation(
    data: CreateEvaluationInput,
  ): Promise<EvaluationWithSkillScores> {
    return this.prisma.evaluationResult.create({
      data: {
        testId: data.testId,
        userId: data.candidateId,
        overallScore: data.overallScore,
        confidenceScore: data.confidenceScore,
        communicationScore: data.communicationScore ?? 0,
        technicalScore: data.technicalScore ?? 0,
        overallRating: data.overallRating ?? 0,
        notes: data.notes,
        skillScores: data.skillScores
          ? {
              create: data.skillScores.map((s) => ({
                skill: s.skill,
                score: s.score,
                feedback: s.feedback,
              })),
            }
          : undefined,
      },
      include: { skillScores: true },
    });
  }

  /**
   * Updates an existing evaluation result by ID.
   * Only the fields provided in `data` are updated.
   */
  async updateEvaluation(
    id: string,
    data: UpdateEvaluationInput,
  ): Promise<EvaluationResult> {
    return this.prisma.evaluationResult.update({
      where: { id },
      data,
    });
  }

  /**
   * Finds an evaluation result by its ID.
   * Includes related skill scores.
   */
  async findEvaluation(id: string): Promise<EvaluationWithSkillScores | null> {
    return this.prisma.evaluationResult.findUnique({
      where: { id },
      include: { skillScores: true },
    });
  }

  /**
   * Finds an evaluation result by its associated test ID.
   * Leverages the @unique constraint on testId for efficient lookup.
   * Includes related skill scores.
   */
  async findByTest(testId: string): Promise<EvaluationWithSkillScores | null> {
    return this.prisma.evaluationResult.findUnique({
      where: { testId },
      include: { skillScores: true },
    });
  }
}
