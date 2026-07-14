import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { LLMAdapter } from "../../generation-ai/adapters/llm-adapter.interface";
import { AppLogger } from "@intervu-ai/shared-logger";

export interface ImprovementPlansResponse {
  plan7Day: string[];
  plan14Day: string[];
  plan30Day: string[];
}

@Injectable()
export class ImprovementPlanService {
  private readonly logger = new AppLogger({ name: "ImprovementPlanService" });

  constructor(
    private readonly prisma: PrismaService,
    @Inject("LLM_ADAPTER") private readonly llmAdapter: LLMAdapter,
  ) {}

  /**
   * Generates customized improvement plans for 7-day, 14-day, and 30-day timelines.
   */
  async generatePlans(attemptId: string): Promise<ImprovementPlansResponse> {
    this.logger.info("Generating improvement plans for attempt", { attemptId });

    // Fetch attempt details
    const attempt = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      include: {
        candidateResult: true,
        evaluationAnalytics: true,
      },
    });

    if (!attempt || !attempt.candidateResult || !attempt.evaluationAnalytics) {
      this.logger.warn(
        "Attempt results or analytics missing for plans generation",
        { attemptId },
      );
      return this.generateFallbackPlans([]);
    }

    const topicAccuracy =
      (attempt.evaluationAnalytics.topicAccuracy as Record<string, number>) ||
      {};
    const score = attempt.candidateResult.percentage;

    // Find weakest topics (accuracy < 75%)
    const weakTopics = Object.entries(topicAccuracy)
      .filter(([_, acc]) => acc < 75)
      .sort((a, b) => a[1] - b[1])
      .map(([topic]) => topic);

    let performanceLevel: "HIGH" | "AVERAGE" | "WEAK" = "AVERAGE";
    if (score >= 85 && weakTopics.length === 0) {
      performanceLevel = "HIGH";
    } else if (score < 60 || weakTopics.length >= 3) {
      performanceLevel = "WEAK";
    }

    let lastError: any;
    for (let attemptCount = 1; attemptCount <= 3; attemptCount++) {
      try {
        const prompt = `
You are an expert tutor. Create three distinct, structured study plans (7-day, 14-day, and 30-day timelines) for a candidate based on their performance level: ${performanceLevel} and their weakest topics: ${JSON.stringify(weakTopics)}.

INSTRUCTIONS:
- If the performance level is HIGH, focus the plans on speed optimization, hard problems, advanced mock exams, and pacing. Do NOT suggest basic concept review.
- If the performance level is AVERAGE, focus the plans on concept reinforcement, medium difficulty sets, section tests, and error logging.
- If the performance level is WEAK, focus the plans on foundational basics, easy-to-medium questions, step-by-step concepts, and revision.

Each plan should contain actionable study steps as arrays of strings.

Return a JSON object matching this schema:
{
  "plan7Day": [
    "Day 1-2: Review core concepts of Logical Reasoning.",
    "Day 3-5: Solve 20 medium difficulty practice questions daily.",
    "Day 6-7: Take a full length mock test and review incorrect answers."
  ],
  "plan14Day": [
    "Week 1: Practice 15 Verbal Ability questions daily and build vocabulary.",
    "Week 2: Review Logical Reasoning structures and complete 5 section tests."
  ],
  "plan30Day": [
    "Week 1-2: Solidify math basics and practice Quantitative Aptitude formulas.",
    "Week 3: Complete daily practice sheets on Verbal and Logical topics.",
    "Week 4: Focus on timed section practices and revision of incorrect answers."
  ]
}
Ensure the output is ONLY valid JSON. Do not include markdown tags like \`\`\`json.
`;

        const response = await this.llmAdapter.generate(prompt);
        let cleaned = response.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned
            .replace(/^```(?:json)?/gi, "")
            .replace(/```$/gi, "")
            .trim();
        }
        const parsed = JSON.parse(cleaned);

        if (
          parsed &&
          Array.isArray(parsed.plan7Day) &&
          Array.isArray(parsed.plan14Day) &&
          Array.isArray(parsed.plan30Day)
        ) {
          await this.savePlans(attemptId, parsed);
          return parsed;
        }

        throw new Error("Invalid format returned by LLM");
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `LLM plans generation failed on attempt ${attemptCount}. Retrying...`,
          {
            attemptId,
            error: error instanceof Error ? error.message : String(error),
          },
        );
      }
    }

    this.logger.warn(
      "LLM plans generation completely failed. Falling back to rule-based plans.",
      {
        attemptId,
        error: lastError instanceof Error ? lastError.message : String(lastError),
      },
    );

    const fallbackPlans = this.generateFallbackPlans(
      weakTopics,
      performanceLevel,
    );
    await this.savePlans(attemptId, fallbackPlans);
    return fallbackPlans;
  }

  /**
   * Saves the generated plans to the improvement_plans table.
   */
  async savePlans(
    attemptId: string,
    plans: ImprovementPlansResponse,
    retryCount = 0,
  ): Promise<void> {
    try {
      await this.prisma.improvementPlan.upsert({
        where: { attemptId },
        update: {
          plan7Day: plans.plan7Day,
          plan14Day: plans.plan14Day,
          plan30Day: plans.plan30Day,
          createdAt: new Date(),
        },
        create: {
          attemptId,
          plan7Day: plans.plan7Day,
          plan14Day: plans.plan14Day,
          plan30Day: plans.plan30Day,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      if (retryCount < 2) {
        this.logger.warn("Database connection error during savePlans, retrying...", { attemptId, retryCount });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.savePlans(attemptId, plans, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Rule-based fallback generator for study plans.
   */
  private generateFallbackPlans(
    weakTopics: string[],
    performanceLevel: "HIGH" | "AVERAGE" | "WEAK" = "AVERAGE",
  ): ImprovementPlansResponse {
    if (performanceLevel === "HIGH" || weakTopics.length === 0) {
      return {
        plan7Day: [
          "Day 1-2: Complete advanced, high-difficulty challenge problem sets on core topics.",
          "Day 3-5: Run timed full-length mock exams and analyze pacing and time spent per question.",
          "Day 6-7: Focus on micro-error logs, reviewing solutions for alternative/faster methods.",
        ],
        plan14Day: [
          "Week 1: Perform 20 high-difficulty timed section tests, targeting <45 seconds per question.",
          "Week 2: Solve complex case study challenges and practice mathematical shortcut techniques.",
        ],
        plan30Day: [
          "Week 1-2: Complete high-difficulty conceptual revisions and timed mock series.",
          "Week 3: Target weak subsections with custom timed exercises and focus on extreme pacing constraints.",
          "Week 4: Execute 4 complete mock exams under 90% of actual time limits to build safety buffers.",
        ],
      };
    }

    const focusTopic1 = weakTopics[0] || "General Aptitude";
    const focusTopic2 = weakTopics[1] || "Logical Reasoning";

    return {
      plan7Day: [
        `Day 1-2: Review core formulas and theoretical concepts of ${focusTopic1}.`,
        `Day 3-5: Solve 20 medium difficulty questions daily on ${focusTopic1}.`,
        `Day 6-7: Review all incorrect answers, check explanations, and take a 30-minute practice quiz.`,
      ],
      plan14Day: [
        `Week 1: Build deep focus on ${focusTopic1}. Read core explanations and solve 15 medium/hard problems daily.`,
        `Week 2: Shift attention to ${focusTopic2}. Complete 10 practice questions daily and review pacing/time spent per question.`,
      ],
      plan30Day: [
        `Week 1: Strengthen fundamental concepts of ${focusTopic1} and solve 10 easy-to-medium questions daily.`,
        `Week 2: Solve 15 medium-to-hard questions daily on ${focusTopic1} and analyze weak subsections.`,
        `Week 3: Cover core topics in ${focusTopic2} with daily 15-question sets and error logging.`,
        `Week 4: Take 3 complete mock practice tests, focus on pacing, and revise formulas for all weak sections.`,
      ],
    };
  }
}
