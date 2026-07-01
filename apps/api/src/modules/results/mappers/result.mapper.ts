import { ResultResponseDto, SkillScoreDto } from "@intervu/shared";

export class ResultMapper {
  static toDto(entity: any): ResultResponseDto {
    return {
      id: entity.id,
      testId: entity.testId,
      testInstanceId: entity.testInstanceId,
      userId: entity.userId,
      communicationScore: entity.communicationScore,
      technicalScore: entity.technicalScore,
      confidenceScore: entity.confidenceScore,
      overallScore: entity.overallScore,
      overallRating: entity.overallRating,
      notes: entity.notes,
      totalQuestions: entity.totalQuestions,
      correctAnswers: entity.correctAnswers,
      incorrectAnswers: entity.incorrectAnswers,
      evaluatedAt: entity.evaluatedAt,
      skillScores: (entity.skillScores || []).map(
        (skill: any): SkillScoreDto => ({
          id: skill.id,
          skill: skill.skill,
          score: skill.score,
          feedback: skill.feedback,
        }),
      ),
    };
  }
}
