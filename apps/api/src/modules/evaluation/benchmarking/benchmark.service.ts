import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

export interface BenchmarkDto {
  candidate: number; // overall percentage
  assessmentAverage: number;
  sections: {
    sectionKey: string;
    sectionName: string;
    candidateScore: number;
    averageScore: number;
  }[];
  topics: {
    topicName: string;
    candidateAccuracy: number;
    averageAccuracy: number;
  }[];
  difficulties: {
    difficulty: string;
    candidateAccuracy: number;
    averageAccuracy: number;
  }[];
}

@Injectable()
export class BenchmarkService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates benchmark comparison metrics comparing candidate to overall averages.
   */
  async getBenchmark(attemptId: string): Promise<BenchmarkDto> {
    // 1. Fetch current attempt details
    const currentAttempt = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      include: {
        candidateResult: true,
        evaluationAnalytics: true,
        sections: true,
      },
    });

    if (!currentAttempt) {
      throw new NotFoundException(`Attempt ${attemptId} not found`);
    }

    const { testConfigId, candidateResult, evaluationAnalytics } =
      currentAttempt;

    if (!candidateResult || !evaluationAnalytics) {
      throw new NotFoundException(
        `Result or analytics not found for attempt ${attemptId}`,
      );
    }

    // 2. Fetch assessment overall average using aggregate
    const scoreAgg = await this.prisma.candidateResult.aggregate({
      where: {
        attempt: {
          testConfigId,
        },
      },
      _avg: { percentage: true },
      _count: { id: true },
    });

    const assessmentAverage =
      scoreAgg._count.id > 0
        ? (scoreAgg._avg.percentage ?? candidateResult.percentage)
        : candidateResult.percentage;

    // 3. Fetch lightweight cohort analytics records (only JSON columns)
    const cohortAnalytics = await this.prisma.evaluationAnalytics.findMany({
      where: {
        attempt: {
          testConfigId,
        },
      },
      select: {
        sectionAccuracy: true,
        topicAccuracy: true,
        difficultyAccuracy: true,
      },
    });

    // Fallback: if no cohort analytics found, use current candidate analytics
    const activeAnalytics =
      cohortAnalytics.length > 0 ? cohortAnalytics : [evaluationAnalytics];

    // 4. Compute section averages
    const currentSections =
      (evaluationAnalytics.sectionAccuracy as Record<string, number>) || {};
    const sectionAverages: Record<string, { sum: number; count: number }> = {};

    activeAnalytics.forEach((ann) => {
      if (ann.sectionAccuracy) {
        const secAcc = ann.sectionAccuracy as Record<string, number>;
        Object.entries(secAcc).forEach(([secName, score]) => {
          if (!sectionAverages[secName]) {
            sectionAverages[secName] = { sum: 0, count: 0 };
          }
          sectionAverages[secName].sum += score;
          sectionAverages[secName].count++;
        });
      }
    });

    const sectionsDto = currentAttempt.sections.map((section) => {
      const sectionName = section.sectionName || section.sectionKey;
      const candidateScore =
        currentSections[sectionName] ??
        currentSections[section.sectionKey] ??
        0;
      const avgData =
        sectionAverages[sectionName] ?? sectionAverages[section.sectionKey];
      const averageScore =
        avgData && avgData.count > 0
          ? avgData.sum / avgData.count
          : candidateScore;

      return {
        sectionKey: section.sectionKey,
        sectionName,
        candidateScore: Math.round(candidateScore),
        averageScore: Math.round(averageScore),
      };
    });

    // 5. Compute topic averages
    const currentTopics =
      (evaluationAnalytics.topicAccuracy as Record<string, number>) || {};
    const topicAverages: Record<string, { sum: number; count: number }> = {};

    activeAnalytics.forEach((ann) => {
      if (ann.topicAccuracy) {
        const topAcc = ann.topicAccuracy as Record<string, number>;
        Object.entries(topAcc).forEach(([topicName, score]) => {
          if (!topicAverages[topicName]) {
            topicAverages[topicName] = { sum: 0, count: 0 };
          }
          topicAverages[topicName].sum += score;
          topicAverages[topicName].count++;
        });
      }
    });

    const topicsDto = Object.keys(currentTopics).map((topicName) => {
      const candidateAccuracy = currentTopics[topicName] ?? 0;
      const avgData = topicAverages[topicName];
      const averageAccuracy =
        avgData && avgData.count > 0
          ? avgData.sum / avgData.count
          : candidateAccuracy;

      return {
        topicName,
        candidateAccuracy: Math.round(candidateAccuracy),
        averageAccuracy: Math.round(averageAccuracy),
      };
    });

    // 6. Compute difficulty averages
    const currentDifficulties =
      (evaluationAnalytics.difficultyAccuracy as Record<string, number>) || {};
    const difficultyAverages: Record<string, { sum: number; count: number }> =
      {};

    activeAnalytics.forEach((ann) => {
      if (ann.difficultyAccuracy) {
        const diffAcc = ann.difficultyAccuracy as Record<string, number>;
        Object.entries(diffAcc).forEach(([difficulty, score]) => {
          if (!difficultyAverages[difficulty]) {
            difficultyAverages[difficulty] = { sum: 0, count: 0 };
          }
          difficultyAverages[difficulty].sum += score;
          difficultyAverages[difficulty].count++;
        });
      }
    });

    const difficultiesDto = Object.keys(currentDifficulties).map(
      (difficulty) => {
        const candidateAccuracy = currentDifficulties[difficulty] ?? 0;
        const avgData = difficultyAverages[difficulty];
        const averageAccuracy =
          avgData && avgData.count > 0
            ? avgData.sum / avgData.count
            : candidateAccuracy;

        return {
          difficulty,
          candidateAccuracy: Math.round(candidateAccuracy),
          averageAccuracy: Math.round(averageAccuracy),
        };
      },
    );

    return {
      candidate: Math.round(candidateResult.percentage),
      assessmentAverage: Math.round(assessmentAverage),
      sections: sectionsDto,
      topics: topicsDto,
      difficulties: difficultiesDto,
    };
  }
}
