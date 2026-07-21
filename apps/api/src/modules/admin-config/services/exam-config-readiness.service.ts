import { Injectable, NotFoundException } from "@nestjs/common";
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
  private readonly logger = new AppLogger({ name: "ExamConfigReadinessService" });

  constructor(
    private readonly prisma: PrismaService,
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

    // 2. Sections Check
    totalChecksCount++;
    if (config.sections.length > 0) {
      passedCount++;
      checks.push({
        name: "Exam Sections",
        status: "PASS",
        message: `${config.sections.length} section(s) defined.`,
      });
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
      checks.push({
        name: "Difficulty Distribution",
        status: "FAIL",
        message: "Difficulty distribution percentages must sum to 100%.",
      });
    }

    // 4. Topic Unused Question Capacity Check (Cross-Exam Separation)
    let totalRequired = 0;
    let availableUnusedCapacity = 0;
    let conflictingTopicsCount = 0;

    for (const section of config.sections) {
      const sectionTopics = section.sectionTopics;
      const topicCount = sectionTopics.length;
      if (topicCount === 0) continue;

      const questionsPerTopic = Math.ceil(section.questionCount / topicCount);
      const targetDifficulty = medium > 0 ? "MEDIUM" : easy > 0 ? "EASY" : "HARD";

      for (const st of sectionTopics) {
        if (!st.topic) continue;

        totalChecksCount++;
        totalRequired += questionsPerTopic;

        const unusedCount = await this.usageService.getUnusedPoolCount(
          configId,
          st.topic.id,
          targetDifficulty,
        );

        availableUnusedCapacity += unusedCount;

        if (unusedCount >= questionsPerTopic) {
          passedCount++;
          checks.push({
            name: `Question Pool (${st.topic.name})`,
            status: "PASS",
            message: `${unusedCount} unused question(s) available for topic '${st.topic.name}'.`,
          });
        } else {
          conflictingTopicsCount++;
          const conflictingConfigNames =
            await this.usageService.findConflictingConfigsForTopic(
              configId,
              st.topic.id,
            );

          const conflictMsg =
            conflictingConfigNames.length > 0
              ? `(used by exam '${conflictingConfigNames.join(", ")}')`
              : "(pool empty)";

          checks.push({
            name: `Question Pool (${st.topic.name})`,
            status: "WARN",
            message: `Topic '${st.topic.name}' has ${unusedCount} unused questions remaining ${conflictMsg}. Required: ${questionsPerTopic}.`,
            details: {
              topicId: st.topic.id,
              topicName: st.topic.name,
              topicCode: st.topic.code,
              requiredCount: questionsPerTopic,
              availableUnusedCount: unusedCount,
              conflictingConfigNames,
              shortcutUrl: `/admin/question-generation?topicId=${st.topic.id}`,
            },
          });
        }
      }
    }

    const score = Math.round((passedCount / Math.max(1, totalChecksCount)) * 100);
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
}
