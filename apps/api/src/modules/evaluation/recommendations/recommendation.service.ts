import { Injectable } from "@nestjs/common";
import { RecommendationDto } from "@intervu-ai/contracts";
import { PerformanceAnalyticsDto } from "@intervu-ai/contracts";
import { randomUUID } from "crypto";

@Injectable()
export class RecommendationService {
  private readonly conceptToSkillMap: Record<string, string> = {
    time_work: "aptitude",
    "Time and Work": "aptitude",
    percentages: "aptitude",
    Percentages: "aptitude",
    averages: "aptitude",
    Averages: "aptitude",
    profit_loss: "aptitude",
    "Profit and Loss": "aptitude",
    probability: "reasoning",
    Probability: "reasoning",
  };

  /**
   * Generates dynamic, section-aware AI recommendations based on section correct/wrong counts and overall performance.
   */
  generateRecommendations(
    analytics: any,
  ): RecommendationDto[] {
    const recommendations: RecommendationDto[] = [];

    let sections: any[] = [];
    if (Array.isArray(analytics?.sectionAccuracy)) {
      sections = analytics.sectionAccuracy;
    } else if (analytics?.sectionAccuracy && typeof analytics.sectionAccuracy === "object") {
      sections = Object.entries(analytics.sectionAccuracy).map(([name, acc]) => ({
        sectionName: name,
        accuracy: Number(acc) || 0,
        correct: 0,
        wrong: 0,
        skipped: 0,
      }));
    }

    sections.forEach((sec) => {
      const acc = Math.round(sec.accuracy || 0);
      const correct = sec.correct || 0;
      const wrong = sec.wrong || 0;
      const skipped = sec.skipped || 0;
      const total = sec.questionCount || (correct + wrong + skipped) || 1;
      const secName = sec.sectionName || "Section";
      const nameLower = secName.toLowerCase();

      let priority: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
      let title = `Improve ${secName}`;
      let description = "";

      if (acc < 50) {
        priority = "HIGH";
      } else if (acc >= 75) {
        priority = "LOW";
        title = `Excel in ${secName}`;
      }

      if (nameLower.includes("coding") || nameLower.includes("programming")) {
        if (acc < 50) {
          description = `Passed ${correct} of ${total} coding problems (${acc}% accuracy, ${wrong + skipped} failed/unpassed). Review boundary conditions, syntax constraints, and algorithm time complexity.`;
        } else if (acc < 80) {
          description = `Passed ${correct} of ${total} coding problems (${acc}% accuracy). Core logic is solid; focus on handling edge cases, memory constraints, and optimizing space complexity.`;
        } else {
          description = `Optimal coding performance with ${correct}/${total} problems passed (${acc}% accuracy). Practice dynamic programming and advanced algorithms.`;
        }
      } else if (nameLower.includes("numerical") || nameLower.includes("quant") || nameLower.includes("math")) {
        if (acc < 40) {
          description = `Scored ${correct} correct out of ${total} questions (${wrong} incorrect, ${skipped} skipped) with ${acc}% accuracy. High error rate detected; practice mental math shortcuts, ratio-proportions, and percentage estimation.`;
        } else if (acc < 70) {
          description = `Scored ${correct} correct out of ${total} questions (${acc}% accuracy). Re-check calculation accuracy in multi-step word problems to avoid penalty deductions.`;
        } else {
          description = `Strong quantitative accuracy at ${acc}% (${correct}/${total} correct). Focus on speed drills to finish numerical sections with buffer review time.`;
        }
      } else if (nameLower.includes("reasoning") || nameLower.includes("logic")) {
        if (acc < 50) {
          description = `Scored ${correct} correct out of ${total} questions (${wrong} incorrect, ${acc}% accuracy). Review diagrammatic puzzles, blood relations, and syllogism deduction techniques.`;
        } else if (acc < 75) {
          description = `Scored ${correct} correct out of ${total} questions (${acc}% accuracy). Good logical grounding; work on eliminating distractor options in seating arrangement puzzles.`;
        } else {
          description = `Exceptional reasoning performance (${acc}% accuracy, ${correct}/${total} correct). Continue timed puzzle practice to sustain high speed.`;
        }
      } else if (nameLower.includes("verbal") || nameLower.includes("english") || nameLower.includes("communication")) {
        if (acc < 50) {
          description = `Scored ${correct} correct out of ${total} questions (${wrong} wrong, ${acc}% accuracy). Review grammar rules, vocabulary roots, and reading comprehension main-idea extractions.`;
        } else if (acc < 75) {
          description = `Scored ${correct} correct out of ${total} questions (${acc}% accuracy). Solid comprehension; practice speed reading and contextual error-spotting drills.`;
        } else {
          description = `High verbal proficiency at ${acc}% (${correct}/${total} correct). Maintain vocabulary flashcards and timed paragraph analysis.`;
        }
      } else {
        if (acc < 50) {
          description = `Scored ${correct} correct out of ${total} questions (${wrong} wrong, ${skipped} skipped) with ${acc}% accuracy. Priority area: review fundamental concepts and solve 15-20 practice drills.`;
        } else if (acc < 75) {
          description = `Scored ${correct} correct out of ${total} questions (${acc}% accuracy). Practice targeted problem sets to improve answer accuracy and pacing.`;
        } else {
          description = `High section accuracy at ${acc}% (${correct}/${total} correct). Continue mock evaluations to sustain top-tier performance.`;
        }
      }

      if (sec.topics && sec.topics.length > 0) {
        const weakTopics = sec.topics.filter((t: any) => t.accuracy < 60).map((t: any) => t.topicName);
        if (weakTopics.length > 0) {
          description += ` Key Focus Topics: ${weakTopics.join(", ")}.`;
        }
      }

      recommendations.push({
        recommendationId: `rec_${randomUUID()}`,
        skill: secName,
        priority,
        title,
        description,
      });
    });

    if (recommendations.length === 0 && analytics.topicAccuracy) {
      for (const [topic, accuracy] of Object.entries(analytics.topicAccuracy)) {
        const accNum = Number(accuracy) || 0;
        if (accNum < 75) {
          const priority = accNum < 50 ? "HIGH" : "MEDIUM";
          recommendations.push({
            recommendationId: `rec_${randomUUID()}`,
            skill: topic,
            priority,
            title: `Master ${topic}`,
            description: `Accuracy in ${topic} is ${accNum}%. Focus on reviewing core formulas, speed drills, and solving targeted practice problems.`,
          });
        }
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({
        recommendationId: `rec_${randomUUID()}`,
        skill: "general",
        priority: "LOW",
        title: "Maintain Advanced Proficiency",
        description:
          "Exceptional performance! You achieved high accuracy across all sections. Keep practicing to maintain proficiency.",
      });
    }

    return recommendations;
  }
}
