import { PrismaClient, EvaluationResult, RecommendationPriority, Prisma } from "@prisma/client";

export interface CreateEvaluationResultInput {
  testId?: string;
  testInstanceId: string;
  userId: string;
  overallScore: number;
  confidenceScore: number;
  communicationScore?: number;
  technicalScore?: number;
  overallRating?: number;
  notes?: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

export interface UpdateEvaluationResultInput {
  overallScore?: number;
  confidenceScore?: number;
  communicationScore?: number;
  technicalScore?: number;
  overallRating?: number;
  notes?: string;
  correctAnswers?: number;
  incorrectAnswers?: number;
}

type EvaluationWithDetails = Prisma.EvaluationResultGetPayload<{
  include: {
    skillScores: true;
    recommendations: true;
  };
}>;

export class EvaluationResultRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createEvaluation(
    data: CreateEvaluationResultInput,
    tx?: Prisma.TransactionClient
  ): Promise<EvaluationResult> {
    const client = tx || this.prisma;
    return await client.evaluationResult.create({
      data: {
        testId: data.testId,
        testInstanceId: data.testInstanceId,
        userId: data.userId,
        overallScore: data.overallScore,
        confidenceScore: data.confidenceScore,
        communicationScore: data.communicationScore ?? 0,
        technicalScore: data.technicalScore ?? 0,
        overallRating: data.overallRating ?? 0,
        notes: data.notes,
        totalQuestions: data.totalQuestions,
        correctAnswers: data.correctAnswers,
        incorrectAnswers: data.incorrectAnswers,
      },
    });
  }

  /**
   * Extremely optimized nested write creating evaluation, skills, and recommendations in 1 roundtrip.
   */
  async createEvaluationWithNested(
    evaluationData: CreateEvaluationResultInput,
    skills: { skill: string; score: number; feedback: string }[],
    recommendations: { skill: string; priority: RecommendationPriority; title: string; description: string }[],
    tx?: Prisma.TransactionClient
  ): Promise<EvaluationResult> {
    const client = tx || this.prisma;
    return await client.evaluationResult.create({
      data: {
        testId: evaluationData.testId,
        testInstanceId: evaluationData.testInstanceId,
        userId: evaluationData.userId,
        overallScore: evaluationData.overallScore,
        confidenceScore: evaluationData.confidenceScore,
        communicationScore: evaluationData.communicationScore ?? 0,
        technicalScore: evaluationData.technicalScore ?? 0,
        overallRating: evaluationData.overallRating ?? 0,
        notes: evaluationData.notes,
        totalQuestions: evaluationData.totalQuestions,
        correctAnswers: evaluationData.correctAnswers,
        incorrectAnswers: evaluationData.incorrectAnswers,
        skillScores: {
          create: skills.map((s) => ({
            skill: s.skill,
            score: s.score,
            feedback: s.feedback,
          })),
        },
        recommendations: {
          create: recommendations.map((r) => ({
            skill: r.skill,
            priority: r.priority,
            title: r.title,
            description: r.description,
          })),
        },
      },
    });
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<EvaluationWithDetails | null> {
    const client = tx || this.prisma;
    return await client.evaluationResult.findUnique({
      where: { id },
      include: {
        skillScores: true,
        recommendations: true,
      },
    });
  }

  async findByUser(
    userId: string,
    tx?: Prisma.TransactionClient
  ): Promise<EvaluationWithDetails[]> {
    const client = tx || this.prisma;
    return await client.evaluationResult.findMany({
      where: { userId },
      include: {
        skillScores: true,
        recommendations: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByTestInstance(
    testInstanceId: string,
    tx?: Prisma.TransactionClient
  ): Promise<EvaluationWithDetails | null> {
    const client = tx || this.prisma;
    return await client.evaluationResult.findUnique({
      where: { testInstanceId },
      include: {
        skillScores: true,
        recommendations: true,
      },
    });
  }

  async updateEvaluation(
    id: string,
    data: UpdateEvaluationResultInput,
    tx?: Prisma.TransactionClient
  ): Promise<EvaluationResult> {
    const client = tx || this.prisma;
    return await client.evaluationResult.update({
      where: { id },
      data: {
        overallScore: data.overallScore,
        confidenceScore: data.confidenceScore,
        communicationScore: data.communicationScore,
        technicalScore: data.technicalScore,
        overallRating: data.overallRating,
        notes: data.notes,
        correctAnswers: data.correctAnswers,
        incorrectAnswers: data.incorrectAnswers,
      },
    });
  }
}
