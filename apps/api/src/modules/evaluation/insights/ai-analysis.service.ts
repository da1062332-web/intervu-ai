import { Injectable, Inject, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { LLMAdapter } from "../../generation-ai/adapters/llm-adapter.interface";

export interface AiAnalysisResult {
  strengths: { title: string; detail: string }[];
  weaknesses: { title: string; detail: string }[];
  recommendations: {
    priority: "HIGH" | "MEDIUM" | "LOW";
    title: string;
    action: string;
  }[];
  practiceHours: number;
  summary: string;
}

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger("AiAnalysisService");
  getAnalysis: any;

  constructor(
    private readonly prisma: PrismaService,
    @Inject("LLM_ADAPTER") private readonly llmAdapter: LLMAdapter,
  ) {}

  private async getTopicNameMap(): Promise<Map<string, string>> {
    const topics = await this.prisma.topic.findMany({
      select: { id: true, name: true, code: true },
    });
    const concepts = await this.prisma.concept.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        topic: { select: { name: true } },
      },
    });

    const map = new Map<string, string>();
    topics.forEach((t) => {
      map.set(t.id, t.name);
      if (t.code) map.set(t.code, t.name);
    });
    concepts.forEach((c) => {
      const parentOrName = c.topic?.name || c.name;
      map.set(c.id, parentOrName);
      if (c.code) map.set(c.code, parentOrName);
    });
    return map;
  }

  async generateAnalysis(attemptId: string): Promise<AiAnalysisResult> {
    this.logger.log(`Generating AI analysis for attempt: ${attemptId}`);

    const topicNameMap = await this.getTopicNameMap();

    // Fetch rich attempt data
    const attempt = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      include: {
        candidateResult: true,
        evaluationAnalytics: true,
        testConfig: true,
        examConfig: true,
        candidateAnswers: true,
      },
    });

    const candidateResult = attempt?.candidateResult as any;
    const analytics = attempt?.evaluationAnalytics as any;

    if (!attempt || !candidateResult) {
      return this.fallback(50, {}, topicNameMap);
    }

    const overallScore = candidateResult.percentage || 0;
    const rawTopicAccuracy: Record<string, number> =
      (analytics?.topicAccuracy as Record<string, number>) || {};

    // BUG-005: If the assessment was fully skipped (completionRate = 0 or overallScore = 0
    // and no topic has accuracy > 0), return no strengths early — do NOT send to LLM.
    const completionRate = analytics?.completionRate ?? 100;
    const allTopicAccuracies = Object.values(rawTopicAccuracy);
    const allSkipped =
      completionRate === 0 ||
      (overallScore === 0 &&
        allTopicAccuracies.length > 0 &&
        allTopicAccuracies.every((acc) => acc === 0));

    if (allSkipped) {
      this.logger.warn(
        `Assessment ${attemptId} appears fully skipped (completionRate=${completionRate}%). Returning no-strengths result.`,
      );
      const weaknessTopics = Object.keys(rawTopicAccuracy).map((key) => ({
        title: `Improvement Needed: ${topicNameMap.get(key) || key}`,
        detail: `No answers were submitted for this topic. Recommend targeted concept practice.`,
      }));
      return {
        summary: `The assessment was not completed — all questions were skipped. Score: 0%.`,
        practiceHours: 30,
        strengths: [],
        weaknesses:
          weaknessTopics.length > 0
            ? weaknessTopics.slice(0, 4)
            : [
                {
                  title: "Assessment Not Attempted",
                  detail:
                    "All questions were skipped. Please attempt the assessment to receive a meaningful analysis.",
                },
              ],
        recommendations: [
          {
            priority: "HIGH",
            title: "Complete the Assessment",
            action:
              "Attempt all questions to receive an accurate performance analysis and personalized recommendations.",
          },
        ],
      };
    }

    // Map raw UUID keys in topicAccuracy to clean human-readable names
    const topicAccuracy: Record<string, number> = {};
    for (const [key, val] of Object.entries(rawTopicAccuracy)) {
      const cleanName = topicNameMap.get(key) || key;
      topicAccuracy[cleanName] = val;
    }

    const sectionAccuracy: any[] = Array.isArray(analytics?.sectionAccuracy)
      ? analytics.sectionAccuracy
      : [];
    const difficultyAccuracy: Record<string, number> =
      (analytics?.difficultyAccuracy as Record<string, number>) || {};
    const assessmentName =
      attempt.testConfig?.displayName ||
      (attempt.examConfig as any)?.name ||
      "Corporate Assessment";
    const qualification = candidateResult.qualification || "N/A";

    const prompt = `
You are an expert AI assessment evaluator. Analyze the following candidate's assessment performance and generate a comprehensive, personalized evaluation report.

Assessment: ${assessmentName}
Overall Score: ${Math.round(overallScore)}%
Qualification Status: ${qualification}
Completion Rate: ${Math.round(completionRate)}%
Section Performance: ${JSON.stringify(
      sectionAccuracy.map((s: any) => ({
        section: s.sectionName,
        accuracy: Math.round(s.accuracy || 0),
        correct: s.correct,
        wrong: s.wrong,
        total: s.questionCount || s.correct + s.wrong,
      })),
    )}
Topic Accuracy: ${JSON.stringify(topicAccuracy)}
Difficulty Accuracy: ${JSON.stringify(difficultyAccuracy)}

Based on this data, generate a structured analysis with:
1. 2-4 key STRENGTHS (areas where the candidate performed well, >65% accuracy)
2. 2-4 key WEAKNESSES (areas needing improvement, <55% accuracy or consistently wrong)
3. 3-5 prioritized RECOMMENDATIONS with concrete action steps (HIGH/MEDIUM/LOW priority)
4. A brief overall SUMMARY sentence
5. Total estimated PRACTICE_HOURS needed (integer, 5-40 range)

CRITICAL INSTRUCTIONS FOR STRENGTHS AND WEAKNESSES:
- DO NOT INCLUDE ANY PERCENTAGES (e.g. '100%', '75%', '50%', 'X% accuracy') OR NUMBERS IN THE TITLE OR DETAIL TEXT FOR STRENGTHS OR WEAKNESSES.
- Describe candidate performance using qualitative professional terms ONLY (e.g. 'Demonstrated excellent spatial reasoning skills', 'Exhibited solid conceptual understanding', 'Requires targeted practice in programming logic').
- NEVER output raw database IDs, UUIDs, or hex strings (like '10a3707f-7fc6-41c1...') for topic or area titles/descriptions.
- Base everything strictly on the provided performance numbers.

Return ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "summary": "One concise sentence summarizing overall performance",
  "practiceHours": 15,
  "strengths": [
    { "title": "Strong Area Name", "detail": "Qualitative description of achievement without percentages" }
  ],
  "weaknesses": [
    { "title": "Weak Area Name", "detail": "Qualitative description of skill gap without percentages" }
  ],
  "recommendations": [
    { "priority": "HIGH", "title": "Action Title", "action": "Concrete step with specific techniques" }
  ]
}
`;

    // Regex to catch and clean any UUIDs that might slip into strings
    const uuidRegex =
      /'?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'?/gi;
    const cleanString = (str: string): string => {
      if (!str) return str;
      let text = str.replace(uuidRegex, (match) => {
        const rawId = match.replace(/'/g, "");
        const mappedName = topicNameMap.get(rawId);
        return mappedName ? `'${mappedName}'` : "'Core Topic'";
      });

      text = text
        .replace(/Achieved \d+%\s*accuracy,?\s*indicating/gi, "Demonstrated")
        .replace(/Scored \d+%\s*accuracy,?\s*showing/gi, "Exhibited")
        .replace(/Also scored \d+%,?\s*demonstrating/gi, "Demonstrated")
        .replace(/Only \d+%\s*accuracy indicates/gi, "Indicates")
        .replace(/\s*\(\s*\d+%\s*accuracy\s*\)/gi, "")
        .replace(/\s*\d+%\s*accuracy/gi, "")
        .replace(/\s*\d+%/gi, "")
        .replace(/  +/g, " ")
        .trim();

      if (text.length > 0) {
        text = text.charAt(0).toUpperCase() + text.slice(1);
      }
      return text;
    };

    for (let attemptCount = 1; attemptCount <= 3; attemptCount++) {
      try {
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
          Array.isArray(parsed.strengths) &&
          Array.isArray(parsed.weaknesses) &&
          Array.isArray(parsed.recommendations)
        ) {
          return {
            summary: cleanString(
              parsed.summary || `Overall score: ${Math.round(overallScore)}%`,
            ),
            practiceHours: Math.max(
              5,
              Math.min(60, Number(parsed.practiceHours) || 20),
            ),
            strengths: parsed.strengths
              .filter((s: any) => s?.title && s?.detail)
              .map((s: any) => ({
                title: cleanString(s.title),
                detail: cleanString(s.detail),
              })),
            weaknesses: parsed.weaknesses
              .filter((w: any) => w?.title && w?.detail)
              .map((w: any) => ({
                title: cleanString(w.title),
                detail: cleanString(w.detail),
              })),
            recommendations: parsed.recommendations
              .filter((r: any) => r?.title && r?.action)
              .map((r: any) => ({
                priority: (["HIGH", "MEDIUM", "LOW"].includes(r.priority)
                  ? r.priority
                  : "MEDIUM") as "HIGH" | "MEDIUM" | "LOW",
                title: cleanString(r.title),
                action: cleanString(r.action),
              })),
          };
        }

        throw new Error("Invalid response format");
      } catch (error: any) {
        this.logger.warn(
          `AI analysis attempt ${attemptCount} failed: ${error.message}`,
        );
      }
    }

    this.logger.warn("All AI analysis attempts failed, using fallback");
    return this.fallback(overallScore, topicAccuracy, topicNameMap);
  }

  private fallback(
    overallScore: number,
    rawTopicAccuracy: Record<string, number>,
    topicNameMap: Map<string, string>,
  ): AiAnalysisResult {
    const strengths: { title: string; detail: string }[] = [];
    const weaknesses: { title: string; detail: string }[] = [];

    for (const [topicKey, acc] of Object.entries(rawTopicAccuracy)) {
      const topicName = topicNameMap.get(topicKey) || topicKey;
      if (acc >= 65) {
        strengths.push({
          title: `Strong Performance in '${topicName}'`,
          detail: `Achieved ${Math.round(acc)}% accuracy demonstrating solid understanding of core concepts.`,
        });
      } else if (acc < 55) {
        weaknesses.push({
          title: `Improvement Needed in '${topicName}'`,
          detail: `Requires targeted revision and concept practice in core problem-solving techniques.`,
        });
      }
    }

    if (strengths.length === 0) {
      strengths.push({
        title: "Assessment Completion",
        detail: "Demonstrated commitment by completing the full assessment.",
      });
    }
    if (weaknesses.length === 0) {
      weaknesses.push({
        title: "Speed & Accuracy Optimization",
        detail:
          "Minor pacing improvements needed for high-difficulty questions.",
      });
    }

    return {
      summary: `Overall score of ${Math.round(overallScore)}% with clear opportunities for targeted growth.`,
      practiceHours: Math.max(10, Math.round((100 - overallScore) / 5)),
      strengths: strengths.slice(0, 4),
      weaknesses: weaknesses.slice(0, 4),
      recommendations: [
        {
          priority: overallScore < 50 ? "HIGH" : "MEDIUM",
          title: "Focused Revision Drills",
          action:
            "Practice 15-20 targeted problems daily in weak areas to build conceptual clarity.",
        },
        {
          priority: "MEDIUM",
          title: "Timed Mock Assessments",
          action:
            "Complete 2-3 full timed mock assessments per week to improve speed and accuracy.",
        },
        {
          priority: "LOW",
          title: "Maintain Strong Areas",
          action:
            "Review materials related to high accuracy topics weekly to reinforce knowledge.",
        },
      ],
    };
  }
}
