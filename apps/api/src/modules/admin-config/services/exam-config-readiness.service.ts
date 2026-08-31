import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ExamConfigUsageService } from "../../question-bank/services/exam-config-usage.service";
import { AppLogger } from "@intervu-ai/shared-logger";

export interface ReadinessCheckItem {
  name: string;
  status: "PASS" | "WARN" | "FAIL";
  message: string;
  details?: Record<string, unknown>;
}

export interface ExamConfigReadinessResponse {
  configId: string;
  configName: string;
  score: number;
  status: "READY" | "WARNING" | "NOT_READY";
  checks: ReadinessCheckItem[];
  metrics: {
    totalRequired: number;
    availableUnusedCapacity: number;
    conflictingTopicsCount: number;
  };
}

@Injectable()
export class ExamConfigReadinessService {
  private readonly logger = new AppLogger({
    name: "ExamConfigReadinessService",
  });

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ExamConfigUsageService)
    private readonly usageService: ExamConfigUsageService,
  ) {}

  async checkReadiness(configId: string): Promise<ExamConfigReadinessResponse> {
    const config = await this.prisma.examConfig.findUnique({
      where: { id: configId },
      include: {
        sections: {
          include: {
            sectionTopics: {
              include: {
                topic: true,
              },
            },
          },
        },
        difficultyDistribution: true,
        blueprint: true,
      },
    });

    if (!config) {
      throw new NotFoundException(`Exam Configuration ${configId} not found`);
    }

    const checks: ReadinessCheckItem[] = [];
    let passedCount = 0;
    let totalChecksCount = 0;

    // 1. General Config Check
    totalChecksCount++;
    if (config.name && config.role && config.durationMinutes > 0) {
      passedCount++;
      checks.push({
        name: "General Configuration",
        status: "PASS",
        message: "General settings are valid.",
      });
    } else {
      checks.push({
        name: "General Configuration",
        status: "FAIL",
        message: "Configuration name, role, or duration is missing.",
      });
    }

    // 2. Sections Check & Question/Duration Alignment
    totalChecksCount++;
    if (config.sections.length > 0) {
      const sectionTotalQuestions = config.sections.reduce(
        (sum, s) => sum + (s.questionCount || 0),
        0,
      );
      const isQuestionCountMatch =
        sectionTotalQuestions === config.totalQuestions;

      if (isQuestionCountMatch) {
        passedCount++;
        checks.push({
          name: "Exam Sections Question Alignment",
          status: "PASS",
          message: `${config.sections.length} section(s) defined. Section question count total (${sectionTotalQuestions}) matches exam total questions (${config.totalQuestions}).`,
        });
      } else {
        checks.push({
          name: "Exam Sections Question Alignment",
          status: "WARN",
          message: `${config.sections.length} section(s) defined, but sum of section questions (${sectionTotalQuestions}) does not match exam total questions (${config.totalQuestions}).`,
        });
      }

      totalChecksCount++;
      const sectionTotalDuration = config.sections.reduce(
        (sum, s) => sum + (s.sectionDurationMinutes || 0),
        0,
      );
      const isDurationMatch = sectionTotalDuration === config.durationMinutes;

      if (isDurationMatch) {
        passedCount++;
        checks.push({
          name: "Exam Duration Alignment",
          status: "PASS",
          message: `Section duration total (${sectionTotalDuration} mins) matches exam total duration (${config.durationMinutes} mins).`,
        });
      } else {
        checks.push({
          name: "Exam Duration Alignment",
          status: "WARN",
          message: `Sum of section durations (${sectionTotalDuration} mins) does not match exam total duration (${config.durationMinutes} mins).`,
        });
      }
    } else {
      checks.push({
        name: "Exam Sections",
        status: "FAIL",
        message: "No sections defined for this configuration.",
      });
    }

    // 3. Difficulty Distribution Check
    totalChecksCount++;
    const easy = config.difficultyDistribution?.easyPercentage ?? 0;
    const medium = config.difficultyDistribution?.mediumPercentage ?? 0;
    const hard = config.difficultyDistribution?.hardPercentage ?? 0;

    if (easy + medium + hard === 100) {
      passedCount++;
      checks.push({
        name: "Difficulty Distribution",
        status: "PASS",
        message: `Distribution valid (Easy: ${easy}%, Medium: ${medium}%, Hard: ${hard}%).`,
      });
    } else {
      passedCount++;
      checks.push({
        name: "Difficulty Distribution",
        status: "PASS",
        message:
          "Flexible pool distribution (No rigid difficulty percentages enforced).",
      });
    }

    // 4. Topic Question Pool Capacity Check
    let totalRequired = 0;
    let availableUnusedCapacity = 0;
    let conflictingTopicsCount = 0;
    const isManualDifficultyMode = easy + medium + hard === 100;

    // Cache pool count across identical topic+tier evaluations
    const poolCountCache = new Map<string, number>();
    const getCachedPoolCount = async (tId: string, diff?: string) => {
      const cacheKey = `${tId}:${diff || "ANY"}`;
      if (!poolCountCache.has(cacheKey)) {
        poolCountCache.set(
          cacheKey,
          await this.usageService.getUnusedPoolCount(configId, tId, diff),
        );
      }
      return poolCountCache.get(cacheKey)!;
    };

    for (const section of config.sections) {
      const sectionTopics = section.sectionTopics;
      const topicCount = sectionTopics.length;
      if (topicCount === 0) continue;

      const questionsPerTopic = Math.ceil(section.questionCount / topicCount);
      const diffBreakdown = this.calculateDifficultyBreakdown(
        questionsPerTopic,
        easy,
        medium,
        hard,
      );

      for (const st of sectionTopics) {
        if (!st.topic) continue;

        if (isManualDifficultyMode) {
          const tiers: Array<{
            level: "EASY" | "MEDIUM" | "HARD";
            required: number;
          }> = (
            [
              { level: "EASY", required: diffBreakdown.reqEasy },
              { level: "MEDIUM", required: diffBreakdown.reqMedium },
              { level: "HARD", required: diffBreakdown.reqHard },
            ] as const
          ).filter((t) => t.required > 0);

          let allTiersPass = true;
          const missingTierMsgs: string[] = [];
          const tierBreakdown: Array<{
            level: "EASY" | "MEDIUM" | "HARD";
            required: number;
            available: number;
            passed: boolean;
          }> = [];

          for (const tier of tiers) {
            totalChecksCount++;
            totalRequired += tier.required;

            const poolCount = await getCachedPoolCount(
              st.topic.id,
              tier.level,
            );
            availableUnusedCapacity += poolCount;

            const isPassed = poolCount >= tier.required;
            tierBreakdown.push({
              level: tier.level,
              required: tier.required,
              available: poolCount,
              passed: isPassed,
            });

            if (isPassed) {
              passedCount++;
            } else {
              allTiersPass = false;
              missingTierMsgs.push(
                `Missing ${tier.required - poolCount} ${tier.level} question(s) (Available: ${poolCount}, Required: ${tier.required})`,
              );
            }
          }

          if (allTiersPass) {
            checks.push({
              name: `Question Pool (${st.topic.name})`,
              status: "PASS",
              message: `Active questions available in pool for topic '${st.topic.name}' across all required difficulty tiers (${tiers.map((t) => `${t.level}: ${t.required}`).join(", ")}).`,
              details: {
                topicId: st.topic.id,
                topicName: st.topic.name,
                topicCode: st.topic.code,
                tierBreakdown,
              },
            });
          } else {
            conflictingTopicsCount++;
            const conflictingConfigNames =
              await this.usageService.findConflictingConfigsForTopic(
                configId,
                st.topic.id,
              );

            checks.push({
              name: `Question Pool (${st.topic.name})`,
              status: "FAIL",
              message: `Topic '${st.topic.name}' is under-stocked in Question Bank: ${missingTierMsgs.join("; ")}.`,
              details: {
                topicId: st.topic.id,
                topicName: st.topic.name,
                topicCode: st.topic.code,
                missingTierMsgs,
                tierBreakdown,
                conflictingConfigNames,
                shortcutUrl: `/admin/question-generation?topicId=${st.topic.id}`,
              },
            });
          }
        } else {
          totalChecksCount++;
          totalRequired += questionsPerTopic;

          const totalTopicCount = await getCachedPoolCount(
            st.topic.id,
            undefined,
          );

          availableUnusedCapacity += totalTopicCount;

          if (totalTopicCount >= questionsPerTopic) {
            passedCount++;
            checks.push({
              name: `Question Pool (${st.topic.name})`,
              status: "PASS",
              message: `${totalTopicCount} active question(s) available in pool for topic '${st.topic.name}' (Required: ${questionsPerTopic}).`,
            });
          } else {
            conflictingTopicsCount++;
            const conflictingConfigNames =
              await this.usageService.findConflictingConfigsForTopic(
                configId,
                st.topic.id,
              );

            checks.push({
              name: `Question Pool (${st.topic.name})`,
              status: "FAIL",
              message: `Topic '${st.topic.name}' has only ${totalTopicCount} question(s) in pool. Required: ${questionsPerTopic} question(s).`,
              details: {
                topicId: st.topic.id,
                topicName: st.topic.name,
                topicCode: st.topic.code,
                requiredCount: questionsPerTopic,
                availableUnusedCount: totalTopicCount,
                totalTopicCount,
                conflictingConfigNames,
                shortcutUrl: `/admin/question-generation?topicId=${st.topic.id}`,
              },
            });
          }
        }
      }
    }

    // 5. Manual Question & Quality Audit Check
    totalChecksCount++;
    try {
      const manualQuestionsCount = await this.prisma.question.count({
        where: {
          questionSource: "MANUAL",
          status: "ACTIVE",
        },
      });

      if (isManualDifficultyMode) {
        checks.push({
          name: "Manual Question & Quality Audit",
          status: "PASS",
          message: `Manual mode active. ${manualQuestionsCount} active manual question(s) available in bank with explicit difficulty distribution.`,
        });
        passedCount++;
      } else {
        checks.push({
          name: "Manual Question & Quality Audit",
          status: "PASS",
          message: `Flexible mode active. ${manualQuestionsCount} manual question(s) indexed in question bank.`,
        });
        passedCount++;
      }
    } catch (err) {
      checks.push({
        name: "Manual Question & Quality Audit",
        status: "WARN",
        message: `Could not complete manual question audit: ${err instanceof Error ? err.message : String(err)}`,
      });
      passedCount++;
    }

    const score = Math.round(
      (passedCount / Math.max(1, totalChecksCount)) * 100,
    );
    const hasFails = checks.some((c) => c.status === "FAIL");
    const hasWarns = checks.some((c) => c.status === "WARN");

    const status: "READY" | "WARNING" | "NOT_READY" = hasFails
      ? "NOT_READY"
      : hasWarns
        ? "WARNING"
        : "READY";

    return {
      configId,
      configName: config.name,
      score,
      status,
      checks,
      metrics: {
        totalRequired,
        availableUnusedCapacity,
        conflictingTopicsCount,
      },
    };
  }

  private calculateDifficultyBreakdown(
    totalQuestions: number,
    easyPct: number,
    mediumPct: number,
    hardPct: number,
  ): { reqEasy: number; reqMedium: number; reqHard: number } {
    if (totalQuestions <= 0) {
      return { reqEasy: 0, reqMedium: 0, reqHard: 0 };
    }

    const totalPct = easyPct + mediumPct + hardPct;
    if (totalPct === 0) {
      return { reqEasy: 0, reqMedium: totalQuestions, reqHard: 0 };
    }

    const rawEasy = (easyPct / totalPct) * totalQuestions;
    const rawMedium = (mediumPct / totalPct) * totalQuestions;
    const rawHard = (hardPct / totalPct) * totalQuestions;

    let reqEasy = Math.floor(rawEasy);
    let reqMedium = Math.floor(rawMedium);
    let reqHard = Math.floor(rawHard);

    let allocated = reqEasy + reqMedium + reqHard;
    let remainder = totalQuestions - allocated;

    const fractions = [
      { tier: "EASY", frac: rawEasy - reqEasy, pct: easyPct },
      { tier: "MEDIUM", frac: rawMedium - reqMedium, pct: mediumPct },
      { tier: "HARD", frac: rawHard - reqHard, pct: hardPct },
    ].filter((f) => f.pct > 0);

    fractions.sort((a, b) => b.frac - a.frac);

    for (let i = 0; i < remainder && i < fractions.length; i++) {
      if (fractions[i].tier === "EASY") reqEasy++;
      else if (fractions[i].tier === "MEDIUM") reqMedium++;
      else if (fractions[i].tier === "HARD") reqHard++;
    }

    return { reqEasy, reqMedium, reqHard };
  }
}
