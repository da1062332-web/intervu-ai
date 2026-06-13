import { PerformanceSummaryResponseDto } from "@intervu/shared";

export class PerformanceMapper {
  static toDto(data: { testsCompleted: number; averageScore: number; bestScore: number; lastAssessmentDate: Date | null }): PerformanceSummaryResponseDto {
    return {
      testsCompleted: data.testsCompleted,
      averageScore: data.averageScore,
      bestScore: data.bestScore,
      lastAssessmentDate: data.lastAssessmentDate,
    };
  }
}
