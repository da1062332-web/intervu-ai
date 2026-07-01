import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { LLMAdapter } from "../../generation-ai/adapters/llm-adapter.interface";
import { AppLogger } from "@intervu-ai/shared-logger";

@Injectable()
export class AiInsightService {
  private readonly logger = new AppLogger({ name: "AiInsightService" });

  constructor(
    private readonly prisma: PrismaService,
    @Inject("LLM_ADAPTER") private readonly llmAdapter: LLMAdapter,
  ) {}

  /**
   * Generates candidate insights using LLM and falls back to a rule-based generator if needed.
   */
  async generateInsights(attemptId: string): Promise<string[]> {
    this.logger.info("Generating AI insights for attempt", { attemptId });

    // Fetch attempt details
    const attempt = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      include: {
        candidateResult: true,
        evaluationAnalytics: true,
      },
    });

    if (!attempt || !attempt.candidateResult || !attempt.evaluationAnalytics) {
      this.logger.warn("Attempt results or analytics missing for insights generation", { attemptId });
      return this.generateFallbackInsights(50, {}, {}, 100);
    }

    const score = attempt.candidateResult.percentage;
    const topicAccuracy = (attempt.evaluationAnalytics.topicAccuracy as Record<string, number>) || {};
    const difficultyAccuracy = (attempt.evaluationAnalytics.difficultyAccuracy as Record<string, number>) || {};
    const completionRate = attempt.evaluationAnalytics.completionRate || 0;

    try {
      const prompt = `
You are an expert AI assessment evaluator. Generate a list of 3-5 short, qualitative, bulleted performance insights for a candidate based on their assessment results.
Candidate Results:
- Overall Score: ${score}%
- Subject Accuracies: ${JSON.stringify(topicAccuracy)}
- Difficulty Accuracies: ${JSON.stringify(difficultyAccuracy)}
- Completion Rate: ${completionRate}%

Return a JSON object matching this schema:
{
  "insights": [
    "Strong performance in Quantitative Aptitude.",
    "Candidate performs better on medium difficulty questions.",
    "Verbal Ability requires improvement.",
    "High completion rate indicates strong time management."
  ]
}
Ensure the output contains only valid JSON. Do not include markdown tags.
`;

      const response = await this.llmAdapter.generate(prompt);
      const parsed = JSON.parse(response);

      if (parsed && Array.isArray(parsed.insights) && parsed.insights.length > 0) {
        // Save generated insights to the database
        await this.saveInsights(attemptId, parsed.insights);
        return parsed.insights;
      }

      throw new Error("Invalid format returned by LLM");
    } catch (error) {
      this.logger.warn("LLM insights generation failed or returned mock. Falling back to rule-based insights.", {
        attemptId,
        error: error instanceof Error ? error.message : String(error),
      });

      const fallbackInsights = this.generateFallbackInsights(
        score,
        topicAccuracy,
        difficultyAccuracy,
        completionRate,
      );

      await this.saveInsights(attemptId, fallbackInsights);
      return fallbackInsights;
    }
  }

  /**
   * Saves the generated insights to the evaluation_insights table.
   */
  async saveInsights(attemptId: string, insights: string[]): Promise<void> {
    await this.prisma.evaluationInsight.upsert({
      where: { attemptId },
      update: {
        insights,
        createdAt: new Date(),
      },
      create: {
        attemptId,
        insights,
        createdAt: new Date(),
      },
    });
  }

  /**
   * Rule-based fallback generator for insights.
   */
  private generateFallbackInsights(
    score: number,
    topicAccuracy: Record<string, number>,
    difficultyAccuracy: Record<string, number>,
    completionRate: number,
  ): string[] {
    const insights: string[] = [];

    // Topic performance insights
    const sortedTopics = Object.entries(topicAccuracy).sort((a, b) => b[1] - a[1]);
    if (sortedTopics.length > 0) {
      const [bestTopic, bestAcc] = sortedTopics[0];
      if (bestAcc >= 75) {
        insights.push(`Strong performance in ${bestTopic}.`);
      }
      const [worstTopic, worstAcc] = sortedTopics[sortedTopics.length - 1];
      if (worstAcc < 60) {
        insights.push(`${worstTopic} requires improvement.`);
      }
    }

    // Difficulty performance insights
    const hardAcc = difficultyAccuracy["HARD"] ?? difficultyAccuracy["Hard"] ?? 0;
    const mediumAcc = difficultyAccuracy["MEDIUM"] ?? difficultyAccuracy["Medium"] ?? 0;
    const easyAcc = difficultyAccuracy["EASY"] ?? difficultyAccuracy["Easy"] ?? 0;

    if (hardAcc >= 70) {
      insights.push(`Candidate performs exceptionally well on hard difficulty questions.`);
    } else if (mediumAcc > easyAcc && mediumAcc >= 60) {
      insights.push(`Candidate performs better on medium difficulty questions.`);
    } else if (easyAcc >= 75 && hardAcc < 40) {
      insights.push(`Strong foundation on easy concepts, but needs focus on complex, hard questions.`);
    }

    // Time management / Completion rate insights
    if (completionRate >= 90) {
      insights.push(`High completion rate indicates strong time management.`);
    } else if (completionRate < 60) {
      insights.push(`Lower completion rate suggests candidate struggled with pacing or time management.`);
    }

    // Default fallback if no insights matched
    if (insights.length === 0) {
      insights.push(`Completed the assessment with a score of ${score}%.`);
      insights.push(`Maintain regular practice to improve overall speed and accuracy.`);
    }

    return insights;
  }
}
