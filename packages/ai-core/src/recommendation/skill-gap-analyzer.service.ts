import { EvaluationResultDto } from "@intervu-ai/contracts";

export interface GapAnalysisResult {
  weakSkills: string[];
  weakConcepts: string[];
  strongSkills: string[];
  strongConcepts: string[];
  scores: Record<string, number>; // maps concept/skill -> score
}

export class SkillGapAnalyzerService {
  private readonly conceptDisplayNameToKeyMap: Record<string, string> = {
    "time and work": "time_work",
    "time & work": "time_work",
    "percentages": "percentages",
    "probability": "probability",
    "averages": "averages",
    "profit and loss": "profit_loss",
    "profit & loss": "profit_loss",
  };

  /**
   * Analyzes an evaluation result to detect weak and strong skills/concepts.
   * Gap threshold: score < 70.
   */
  analyzeGaps(evaluation: EvaluationResultDto): GapAnalysisResult {
    const weakSkills: string[] = [];
    const strongSkills: string[] = [];
    const weakConcepts: string[] = [];
    const strongConcepts: string[] = [];
    const scores: Record<string, number> = {};

    // 1. Analyze skillScores
    if (evaluation.skillScores) {
      for (const [skill, score] of Object.entries(evaluation.skillScores)) {
        scores[skill] = score;
        if (score < 70) {
          weakSkills.push(skill);
        } else {
          strongSkills.push(skill);
        }
      }
    }

    // 2. Parse feedback to extract concept-level strengths and weaknesses
    if (evaluation.feedback && Array.isArray(evaluation.feedback)) {
      for (const comment of evaluation.feedback) {
        const cleanComment = comment.trim();
        
        // Match "Needs improvement in <ConceptName>."
        if (cleanComment.startsWith("Needs improvement in ")) {
          const conceptPart = cleanComment
            .substring("Needs improvement in ".length)
            .replace(/\.$/, "") // strip trailing period
            .trim();
          
          const conceptKey = this.conceptDisplayNameToKeyMap[conceptPart.toLowerCase()] || conceptPart;
          weakConcepts.push(conceptKey);
          
          // Let's assume a default weak score of 40 (since it needs improvement)
          scores[conceptKey] = 40;
        }
        
        // Match "Strong in <ConceptName>."
        else if (cleanComment.startsWith("Strong in ")) {
          const conceptPart = cleanComment
            .substring("Strong in ".length)
            .replace(/\.$/, "")
            .trim();
          
          const conceptKey = this.conceptDisplayNameToKeyMap[conceptPart.toLowerCase()] || conceptPart;
          strongConcepts.push(conceptKey);
          
          // Let's assume a default strong score of 85 (since it's strong)
          scores[conceptKey] = 85;
        }
      }
    }

    return {
      weakSkills,
      weakConcepts,
      strongSkills,
      strongConcepts,
      scores,
    };
  }
}
