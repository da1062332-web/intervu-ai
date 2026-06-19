import { Injectable, BadRequestException } from "@nestjs/common";
import { AddTopicConfigDto } from "@intervu-ai/contracts";
import { BlueprintConfig, BlueprintTopicConfig } from "@prisma/client";

@Injectable()
export class BlueprintValidatorService {
  validateDifficulty(dto: AddTopicConfigDto) {
    if (dto.easyCount + dto.mediumCount + dto.hardCount !== dto.questionCount) {
      throw new BadRequestException("INVALID_DIFFICULTY_DISTRIBUTION");
    }
  }

  validateQuestionDistribution(
    blueprintTotal: number,
    currentSum: number,
    newCount: number,
  ) {
    if (currentSum + newCount > blueprintTotal) {
      return {
        valid: false,
        missingQuestions: blueprintTotal - currentSum,
      };
    }
    return {
      valid: true,
      missingQuestions: blueprintTotal - (currentSum + newCount),
    };
  }

  validateWeightage(currentWeightage: number, newWeightage: number) {
    const total = currentWeightage + newWeightage;
    if (total > 100) {
      return {
        valid: false,
        totalWeightage: total,
      };
    }
    return {
      valid: true,
      totalWeightage: total,
    };
  }

  validateBlueprintOverall(
    blueprint: Pick<BlueprintConfig, "totalQuestions">,
    topics: Pick<BlueprintTopicConfig, "questionCount" | "weightage">[],
  ) {
    const currentQuestions = topics.reduce(
      (acc, t) => acc + t.questionCount,
      0,
    );
    const currentWeightage = topics.reduce(
      (acc, t) => acc + Number(t.weightage),
      0,
    );

    const isWeightageValid = currentWeightage === 100;
    const isQuestionValid = currentQuestions === blueprint.totalQuestions;

    return {
      valid: isWeightageValid && isQuestionValid,
      missingQuestions: blueprint.totalQuestions - currentQuestions,
      totalWeightage: currentWeightage,
      totalQuestionsConfigured: currentQuestions,
    };
  }
}
