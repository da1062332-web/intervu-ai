import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuestionStatus } from "@prisma/client";

@Injectable()
export class ContentCoverageService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateCoverage() {
    // 1. Fetch all active topics and their active/validated questions
    const topics = await this.prisma.topic.findMany({
      where: { status: "ACTIVE" },
      include: {
        questions: {
          where: {
            status: { in: [QuestionStatus.VALIDATED, QuestionStatus.ACTIVE] },
          },
        },
      },
    });

    const missingTopics: string[] = [];
    const lowCoverageTopics: Array<{
      topic: string;
      count: number;
      required: number;
    }> = [];
    const difficultyGaps: Array<{
      topic: string;
      missingDifficulties: string[];
    }> = [];

    for (const topic of topics) {
      const qCount = topic.questions.length;

      // Check Topic Gaps (0 questions)
      if (qCount === 0) {
        missingTopics.push(topic.name);
      }

      // Check Insufficient Question Counts (< 10 questions)
      if (qCount < 10) {
        lowCoverageTopics.push({
          topic: topic.name,
          count: qCount,
          required: 10,
        });
      }

      // Check Difficulty Gaps (missing EASY, MEDIUM, or HARD)
      const difficulties = new Set(topic.questions.map((q) => q.difficulty));
      const missingDiffs: string[] = [];
      if (!difficulties.has("EASY")) missingDiffs.push("EASY");
      if (!difficulties.has("MEDIUM")) missingDiffs.push("MEDIUM");
      if (!difficulties.has("HARD")) missingDiffs.push("HARD");

      if (missingDiffs.length > 0) {
        difficultyGaps.push({
          topic: topic.name,
          missingDifficulties: missingDiffs,
        });
      }
    }

    // Check Unused Questions (timesUsed = 0 or lastUsed = null)
    const unusedQuestionsRaw = await this.prisma.question.findMany({
      where: {
        timesUsed: 0,
        status: { in: [QuestionStatus.VALIDATED, QuestionStatus.ACTIVE] },
      },
      include: { topic: true },
      take: 100, // Cap to prevent massive payloads
    });

    const unusedQuestions = unusedQuestionsRaw.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      topic: q.topic?.name ?? "Unknown",
      difficulty: q.difficulty,
    }));

    return {
      missingTopics,
      lowCoverageTopics,
      difficultyGaps,
      unusedQuestions,
    };
  }
}
