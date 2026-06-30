import { Injectable } from "@nestjs/common";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";
import { DifficultyValidatorService } from "../validators/difficulty-validator.service";
import { TopicAlignmentService } from "../validators/topic-alignment.service";

export interface GenerationQualityReport {
  duplicateRate: number;
  topicAccuracy: number;
  difficultyAccuracy: number;
  validationSuccessRate: number;
  totalGenerated: number;
  totalPassed: number;
}

@Injectable()
export class GenerationQualityService {
  constructor(
    private readonly topicValidator: TopicAlignmentService,
    private readonly difficultyValidator: DifficultyValidatorService,
  ) {}

  async evaluateBatch(
    questions: GeneratedQuestionDto[],
    requestedTopic: string,
    requestedDifficulty: string,
  ): Promise<GenerationQualityReport> {
    const totalGenerated = questions.length;
    if (totalGenerated === 0) {
      return {
        duplicateRate: 0,
        topicAccuracy: 0,
        difficultyAccuracy: 0,
        validationSuccessRate: 0,
        totalGenerated: 0,
        totalPassed: 0,
      };
    }

    let duplicateCount = 0;
    let topicMatchCount = 0;
    let difficultyMatchCount = 0;
    let passedCount = 0;

    const questionTexts = new Set<string>();

    for (const q of questions) {
      const textNormalized = (q.question || "").trim().toLowerCase();
      
      let isDuplicate = false;
      if (questionTexts.has(textNormalized)) {
        isDuplicate = true;
        duplicateCount++;
      } else {
        questionTexts.add(textNormalized);
      }

      const topicResult = await this.topicValidator.validate(q, requestedTopic);
      if (topicResult.match) {
        topicMatchCount++;
      }

      const diffResult = await this.difficultyValidator.validate(q, requestedDifficulty);
      if (diffResult) {
        difficultyMatchCount++;
      }

      if (!isDuplicate && topicResult.match && diffResult) {
        passedCount++;
      }
    }

    const duplicateRate = Math.round((duplicateCount / totalGenerated) * 100);
    const topicAccuracy = Math.round((topicMatchCount / totalGenerated) * 100);
    const difficultyAccuracy = Math.round((difficultyMatchCount / totalGenerated) * 100);
    const validationSuccessRate = Math.round((passedCount / totalGenerated) * 100);

    return {
      duplicateRate,
      topicAccuracy,
      difficultyAccuracy,
      validationSuccessRate,
      totalGenerated,
      totalPassed: passedCount,
    };
  }
}
