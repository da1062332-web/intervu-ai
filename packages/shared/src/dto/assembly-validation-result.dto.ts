export interface AssemblyValidationResultDto {
  valid: boolean;
  errors: string[];
  metrics: {
    totalQuestions: number;
    difficultyDistribution: {
      EASY: number;
      MEDIUM: number;
      HARD: number;
    };
    topicCoverage: Record<string, number>;
  };
}
