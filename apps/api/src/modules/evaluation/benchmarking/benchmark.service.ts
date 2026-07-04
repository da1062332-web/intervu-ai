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

    // 3. Try PostgreSQL raw queries to aggregate JSON averages (highly optimized)
    const sectionAvgMap: Record<string, number> = {};
    const topicAvgMap: Record<string, number> = {};
    const difficultyAvgMap: Record<string, number> = {};
    let fallbackToPrisma = false;

    try {
      const sectionAvgRaw: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT 
          key as "name",
          ROUND(AVG((value::text)::numeric))::integer as "avg"
        FROM evaluation_analytics ea
        JOIN "TestInstance" ti ON ea.attempt_id = ti.id
        CROSS JOIN LATERAL jsonb_each_text(ea.section_accuracy)
        WHERE ti."testConfigId" = $1
        GROUP BY key
      `, testConfigId);

      const topicAvgRaw: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT 
          key as "name",
          ROUND(AVG((value::text)::numeric))::integer as "avg"
        FROM evaluation_analytics ea
        JOIN "TestInstance" ti ON ea.attempt_id = ti.id
        CROSS JOIN LATERAL jsonb_each_text(ea.topic_accuracy)
        WHERE ti."testConfigId" = $1
        GROUP BY key
      `, testConfigId);

      const diffAvgRaw: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT 
          key as "name",
          ROUND(AVG((value::text)::numeric))::integer as "avg"
        FROM evaluation_analytics ea
        JOIN "TestInstance" ti ON ea.attempt_id = ti.id
        CROSS JOIN LATERAL jsonb_each_text(ea.difficulty_accuracy)
        WHERE ti."testConfigId" = $1
        GROUP BY key
      `, testConfigId);

      sectionAvgRaw.forEach((r) => (sectionAvgMap[r.name] = r.avg));
      topicAvgRaw.forEach((r) => (topicAvgMap[r.name] = r.avg));
      diffAvgRaw.forEach((r) => (difficultyAvgMap[r.name] = r.avg));

      if (topicAvgRaw.length === 0) {
        fallbackToPrisma = true;
      }
    } catch (err) {
      fallbackToPrisma = true;
    }

    if (fallbackToPrisma) {
      // 3b. Fetch lightweight cohort analytics records (only JSON columns)
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

      // Calculate section averages
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
      Object.entries(sectionAverages).forEach(([name, data]) => {
        sectionAvgMap[name] = data.count > 0 ? Math.round(data.sum / data.count) : 0;
      });

      // Calculate topic averages
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
      Object.entries(topicAverages).forEach(([name, data]) => {
        topicAvgMap[name] = data.count > 0 ? Math.round(data.sum / data.count) : 0;
      });

      // Calculate difficulty averages
      const difficultyAverages: Record<string, { sum: number; count: number }> = {};
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
      Object.entries(difficultyAverages).forEach(([name, data]) => {
        difficultyAvgMap[name] = data.count > 0 ? Math.round(data.sum / data.count) : 0;
      });
    }

    const currentSections =
      (evaluationAnalytics.sectionAccuracy as Record<string, number>) || {};

    const sectionsDto = currentAttempt.sections.map((section) => {
      const sectionName = section.sectionName || section.sectionKey;
      const candidateScore =
        currentSections[sectionName] ??
        currentSections[section.sectionKey] ??
        0;
      const averageScore =
        sectionAvgMap[sectionName] ?? sectionAvgMap[section.sectionKey] ?? candidateScore;

      return {
        sectionKey: section.sectionKey,
        sectionName,
        candidateScore: Math.round(candidateScore),
        averageScore: Math.round(averageScore),
      };
    });

    const currentTopics =
      (evaluationAnalytics.topicAccuracy as Record<string, number>) || {};

    const topicsDto = Object.keys(currentTopics).map((topicName) => {
      const candidateAccuracy = currentTopics[topicName] ?? 0;
      const averageAccuracy = topicAvgMap[topicName] ?? candidateAccuracy;

      return {
        topicName,
        candidateAccuracy: Math.round(candidateAccuracy),
        averageAccuracy: Math.round(averageAccuracy),
      };
    });

    const currentDifficulties =
      (evaluationAnalytics.difficultyAccuracy as Record<string, number>) || {};

    const difficultiesDto = Object.keys(currentDifficulties).map(
      (difficulty) => {
        const candidateAccuracy = currentDifficulties[difficulty] ?? 0;
        const averageAccuracy = difficultyAvgMap[difficulty] ?? candidateAccuracy;

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
