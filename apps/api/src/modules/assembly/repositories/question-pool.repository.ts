import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { DifficultyLevel } from "@prisma/client";

@Injectable()
export class QuestionPoolRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailableQuestions(
    conceptKey: string,
    difficulty: DifficultyLevel,
    limit: number,
    excludeIds: string[] = [],
  ) {
    const questions = await this.prisma.generatedQuestion.findMany({
      where: {
        conceptKey,
        difficultyLevel: difficulty,
        id: {
          notIn: excludeIds,
        },
      },
      take: limit,
      // Could order by random here, or simply take the first available. For performance:
      orderBy: { createdAt: "asc" },
    });

    // For Module 3 MVP: Auto-mock questions if the pool has insufficient questions
    if (questions.length < limit) {
      const needed = limit - questions.length;
      for (let i = 0; i < needed; i++) {
        questions.push({
          id: `mock-q-${conceptKey}-${difficulty}-${Date.now()}-${i}`,
          conceptKey,
          difficultyLevel: difficulty,
          questionHash: `mock-hash-${Date.now()}-${i}`,
          questionType: "MULTIPLE_CHOICE",
          questionText: `This is an auto-generated mock question for topic ${conceptKey} at ${difficulty} difficulty.`,
          expectedAnswer: "Mock Answer",
          rubric: {},
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      }
    }

    return questions;
  }

  async findRecentUsedQuestions(userId: string) {
    // Finds questions the candidate has recently seen
    const testInstances = await this.prisma.testInstance.findMany({
      where: { userId },
      select: {
        questions: {
          select: { questionId: true },
        },
      },
    });

    const recentIds = new Set<string>();
    for (const ti of testInstances) {
      for (const q of ti.questions) {
        recentIds.add(q.questionId);
      }
    }

    return Array.from(recentIds);
  }

  async getQuestionsByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return this.prisma.generatedQuestion.findMany({
      where: {
        id: { in: ids },
      },
    });
  }
}
