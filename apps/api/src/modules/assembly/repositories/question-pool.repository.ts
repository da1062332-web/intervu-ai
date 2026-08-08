import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { DifficultyLevel, GeneratedQuestion, Question } from "@prisma/client";

import {
  QuestionFilters,
  IQuestionSource,
} from "../services/question-source.interface";

@Injectable()
export class QuestionPoolRepository implements IQuestionSource {
  constructor(private readonly prisma: PrismaService) {}

  async fetchQuestions(filters: QuestionFilters): Promise<GeneratedQuestion[]> {
    return this.findAvailableQuestions(
      filters.conceptKey || "",
      (filters.difficultyLevel as DifficultyLevel) || "MEDIUM",
      filters.limit || 10,
      filters.excludeIds || [],
    );
  }

  async findAvailableQuestions(
    conceptKey: string,
    difficulty: DifficultyLevel,
    limit: number,
    excludeIds: string[] = [],
  ) {
    let topicIdsToMatch = [conceptKey];
    if (conceptKey) {
      const topicObj = await this.prisma.topic.findFirst({
        where: { OR: [{ code: conceptKey }, { id: conceptKey }] },
      });
      if (topicObj) {
        topicIdsToMatch = Array.from(
          new Set([conceptKey, topicObj.id, topicObj.code]),
        );
      }
    }

    const realQuestions = await this.prisma.question.findMany({
      where: {
        topicId: { in: topicIdsToMatch },
        difficulty,
        status: "ACTIVE",
        id: {
          notIn: excludeIds,
        },
      },
      take: limit,
      orderBy: { createdAt: "asc" },
    });

    if (realQuestions.length >= limit) {
      return realQuestions
        .slice(0, limit)
        .map((question) => this.mapQuestionToGeneratedQuestion(question));
    }

    const remaining = limit - realQuestions.length;
    const legacyQuestions = await this.prisma.generatedQuestion.findMany({
      where: {
        conceptKey,
        difficultyLevel: difficulty,
        id: {
          notIn: excludeIds,
        },
      },
      take: remaining,
      orderBy: { createdAt: "asc" },
    });

    return [
      ...realQuestions.map((question) =>
        this.mapQuestionToGeneratedQuestion(question),
      ),
      ...legacyQuestions.map((question) => ({
        ...question,
        conceptKey: question.conceptKey || conceptKey,
      })),
    ];
  }

  private mapQuestionToGeneratedQuestion(
    question: Question,
  ): GeneratedQuestion {
    const metadata =
      (question.metadata as Record<string, unknown> | null) ?? {};
    const mcqData = (question.mcqData as any) ?? null;
    const codingData = (question.codingData as any) ?? null;

    let options = metadata.options as GeneratedQuestion["options"];
    if (
      (!Array.isArray(options) || options.length < 4) &&
      mcqData?.options &&
      Array.isArray(mcqData.options) &&
      mcqData.options.length >= 4
    ) {
      options = mcqData.options;
    }

    return {
      id: question.id,
      templateId: question.templateId ?? "",
      questionHash: question.id,
      conceptKey: question.topicId,
      difficultyLevel: question.difficulty as DifficultyLevel,
      questionType: question.questionType || "MULTIPLE_CHOICE",
      questionText: question.questionText,
      options:
        Array.isArray(options) && options.length >= 4
          ? options
          : mcqData?.options || [question.answer],
      mcqData,
      codingData,
      correctAnswer: question.answer as GeneratedQuestion["correctAnswer"],
      solution: question.explanation as GeneratedQuestion["solution"],
      metadata: {
        ...metadata,
        source: "QUESTION_BANK",
      },
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    } as GeneratedQuestion;
  }

  async findRecentUsedQuestions(userId: string) {
    const historyLimitStr = process.env.ANTI_REPETITION_HISTORY_LIMIT;
    const historyLimit = historyLimitStr
      ? parseInt(historyLimitStr, 10)
      : undefined;

    // Finds questions the candidate has recently seen
    const testInstances = await this.prisma.testInstance.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: historyLimit && historyLimit > 0 ? historyLimit : undefined,
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

    const [generatedQuestions, realQuestions] = await Promise.all([
      this.prisma.generatedQuestion.findMany({
        where: { id: { in: ids } },
      }),
      this.prisma.question.findMany({
        where: { id: { in: ids } },
      }),
    ]);

    return [
      ...generatedQuestions,
      ...realQuestions.map((q) => this.mapQuestionToGeneratedQuestion(q)),
    ];
  }
}
