export type ValidationFailureReason =
  | "constraint_violation"
  | "difficulty_mismatch"
  | "solvability_failure"
  | "duplicate_collision"
  | "other";

export interface GenerationRun {
  templateId: string;
  success: boolean;
  runtimeMs: number;
  attemptsUsed: number;
  failures: { reason: ValidationFailureReason; count: number }[];
}

export interface TemplateMetadataContract {
  templateId: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  tags?: string[];
  metrics: {
    generationSuccessRate: number;
    validationSuccessRate: number;
    validationFailures: number;
    duplicateFrequency: number;
    averageRuntimeMs: number;
    retryCounts: number;
    failureBreakdown: Record<ValidationFailureReason, number>;
  };
}

export class MetricsTracker {
  private runs: GenerationRun[] = [];

  recordRun(run: GenerationRun): void {
    this.runs.push(run);
  }

  getMetricsForTemplate(
    templateId: string,
    difficulty: "easy" | "medium" | "hard",
    topic: string,
    tags?: string[],
  ): TemplateMetadataContract {
    const templateRuns = this.runs.filter((r) => r.templateId === templateId);
    const totalRuns = templateRuns.length;

    if (totalRuns === 0) {
      return {
        templateId,
        difficulty,
        topic,
        tags,
        metrics: {
          generationSuccessRate: 0,
          validationSuccessRate: 0,
          validationFailures: 0,
          duplicateFrequency: 0,
          averageRuntimeMs: 0,
          retryCounts: 0,
          failureBreakdown: {
            constraint_violation: 0,
            difficulty_mismatch: 0,
            solvability_failure: 0,
            duplicate_collision: 0,
            other: 0,
          },
        },
      };
    }

    const successes = templateRuns.filter((r) => r.success).length;
    const successRate = totalRuns > 0 ? successes / totalRuns : 0;

    let totalValidationFailures = 0;
    let totalDuplicateCollisions = 0;
    let totalRuntimeMs = 0;
    let totalRetries = 0;

    const failureBreakdown: Record<ValidationFailureReason, number> = {
      constraint_violation: 0,
      difficulty_mismatch: 0,
      solvability_failure: 0,
      duplicate_collision: 0,
      other: 0,
    };

    for (const r of templateRuns) {
      totalRuntimeMs += r.runtimeMs;
      // Retries are the failed attempts. If successful, it took attemptsUsed - 1 retries.
      // If it failed completely, it took attemptsUsed retries (all attempts failed).
      totalRetries += Math.max(0, r.attemptsUsed - (r.success ? 1 : 0));
      for (const f of r.failures) {
        failureBreakdown[f.reason] =
          (failureBreakdown[f.reason] || 0) + f.count;
        totalValidationFailures += f.count;
        if (f.reason === "duplicate_collision") {
          totalDuplicateCollisions += f.count;
        }
      }
    }

    const avgRuntime = totalRuntimeMs / totalRuns;
    const duplicateFrequency =
      totalRuns > 0 ? totalDuplicateCollisions / totalRuns : 0;

    return {
      templateId,
      difficulty,
      topic,
      tags,
      metrics: {
        generationSuccessRate: Math.round(successRate * 100) / 100,
        validationSuccessRate: Math.round(successRate * 100) / 100,
        validationFailures: totalValidationFailures,
        duplicateFrequency: Math.round(duplicateFrequency * 100) / 100,
        averageRuntimeMs: Math.round(avgRuntime * 100) / 100,
        retryCounts: totalRetries,
        failureBreakdown,
      },
    };
  }

  clear(): void {
    this.runs = [];
  }
}
