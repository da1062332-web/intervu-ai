export interface AssemblyAnalyticsDto {
  topicDistribution: Record<string, number>;
  difficultyDistribution: Record<string, number>;
  sectionDistribution: Record<string, number>;
  coverageDistribution: Record<string, number>;
  overallHealthScore: number;
}
