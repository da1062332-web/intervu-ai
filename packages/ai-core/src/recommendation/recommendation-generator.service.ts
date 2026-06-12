import { RecommendationDto } from "@intervu-ai/contracts";
import { randomUUID } from "crypto";

export interface CatalogEntry {
  title: string;
  description: string;
}

export class RecommendationGeneratorService {
  // Recommendation catalog mapping conceptOrSkill + priority to title & description
  private readonly catalog: Record<
    string,
    Record<"HIGH" | "MEDIUM" | "LOW", CatalogEntry>
  > = {
    time_work: {
      HIGH: {
        title: "Master Time & Work Foundations",
        description:
          "Revise rate of work calculations, unitary method, and joint work formulas. Practice 15 beginner level exercises.",
      },
      MEDIUM: {
        title: "Optimize Work Sharing Efficiency",
        description:
          "Practice pipeline and multi-person work sharing problems. Focus on pipes & cisterns variations.",
      },
      LOW: {
        title: "Advanced Alternating Work Patterns",
        description:
          "Study advanced alternating days work schedules and variable efficiency parameters to maximize speed.",
      },
    },
    percentages: {
      HIGH: {
        title: "Rebuild Percentage Basics",
        description:
          "Focus on fraction-to-percentage conversions and simple interest calculations. Solve 20 basic linear percentage problems.",
      },
      MEDIUM: {
        title: "Enhance Percentage Profit & Base Shifts",
        description:
          "Practice price increase/consumption reduction problems and successive percentage changes.",
      },
      LOW: {
        title: "Master Complex Percentage Ratios",
        description:
          "Solve high-difficulty compound growth rates and population multi-percentage shifts.",
      },
    },
    probability: {
      HIGH: {
        title: "Understand Classical Probability Rules",
        description:
          "Study sample space definitions, basic coin/dice events, and the basic formula (favorable/total).",
      },
      MEDIUM: {
        title: "Practice Conditional & Multi-stage Probability",
        description:
          "Focus on ball drawing without replacement and independent vs dependent event probability rules.",
      },
      LOW: {
        title: "Solve Bayes' Theorem & Combinatorial Problems",
        description:
          "Deepen understanding of Bayes' theorem and permutations/combinations applied to complex probabilities.",
      },
    },
    averages: {
      HIGH: {
        title: "Averages Basics and Sum Calculations",
        description:
          "Practice calculating simple averages and understanding the relation between sum, count, and average.",
      },
      MEDIUM: {
        title: "Solve Average Weight Shift Problems",
        description:
          "Focus on average shifts when a member is added/removed (e.g. teacher weight addition problems).",
      },
      LOW: {
        title: "Master Overlapping Average Series",
        description:
          "Study consecutive number average properties and temperature/score overlap average calculations.",
      },
    },
    profit_loss: {
      HIGH: {
        title: "Learn Cost Price and Selling Price Relations",
        description:
          "Revise formulas for Profit %, Loss %, and markup calculations. Practice 10 beginner problems.",
      },
      MEDIUM: {
        title: "Understand Marked Price and Discounts",
        description:
          "Solve problems involving successive discounts, markup percentages, and deceptive balance scales.",
      },
      LOW: {
        title: "Analyze Complex Profit/Loss Break-Evens",
        description:
          "Practice advanced transition problems where a loss in one deal is offset by profit in another.",
      },
    },
    aptitude: {
      HIGH: {
        title: "Quantitative Aptitude Boot Camp",
        description:
          "Spend 30 minutes daily on basic math operations, mental arithmetic, and algebraic simplifications.",
      },
      MEDIUM: {
        title: "Speed Mathematics Practice",
        description:
          "Learn shortcut techniques for multiplication, squaring, and quick estimations to save exam time.",
      },
      LOW: {
        title: "Mock Quantitative Aptitude Challenges",
        description:
          "Take full-length quantitative reasoning mock tests under timed conditions to maintain peak performance.",
      },
    },
    reasoning: {
      HIGH: {
        title: "Logical Deductions Foundations",
        description:
          "Study Venn diagrams, logical syllogisms, and basic condition-based reasoning layouts.",
      },
      MEDIUM: {
        title: "Analytical Reasoning Practice",
        description:
          "Practice puzzle solving, seating arrangements, and multi-variable logical matching tests.",
      },
      LOW: {
        title: "Advanced Cognitive Reasoning Tasks",
        description:
          "Engage with complex logical matrices, critical path deductions, and abstract reasoning problems.",
      },
    },
  };

  /**
   * Translates a score to a priority.
   */
  getPriority(score: number): "HIGH" | "MEDIUM" | "LOW" {
    if (score < 50) return "HIGH";
    if (score <= 70) return "MEDIUM";
    return "LOW";
  }

  /**
   * Generates a single recommendation for a given concept or skill and score.
   */
  generate(key: string, score: number): RecommendationDto | null {
    const priority = this.getPriority(score);
    const catalogGroup = this.catalog[key];

    if (!catalogGroup) {
      // Fallback for unknown concept/skills
      return {
        recommendationId: `rec_${randomUUID()}`,
        skill: key,
        priority,
        title: `Improve performance in ${key}`,
        description: `Review your incorrect answers in ${key} and revise basic theory and formulas. Current score is ${score}%.`,
      };
    }

    const entry = catalogGroup[priority];
    return {
      recommendationId: `rec_${randomUUID()}`,
      skill: key,
      priority,
      title: entry.title,
      description: entry.description,
    };
  }
}
