import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { BlueprintSectionDto } from "@intervu/shared";
import { AllocatedQuestionDto } from "@intervu/shared";

import { AntiRepetitionService } from "./anti-repetition.service";
import { DifficultyLevel } from "@prisma/client";
import { IQuestionSource, QUESTION_SOURCE_TOKEN } from "./question-source.interface";
import { Inject } from "@nestjs/common";

export interface AllocationConfig {
  distribution: {
    EASY: number;
    MEDIUM: number;
    HARD: number;
  };
}

@Injectable()
export class QuestionAllocatorService {
  constructor(
    @Inject(QUESTION_SOURCE_TOKEN)
    private readonly questionSource: IQuestionSource,
    private readonly antiRepetitionService: AntiRepetitionService,
  ) {}

  async allocateQuestions(
    section: BlueprintSectionDto,
    allocatedQuestionIds: Set<string>,
    historyIds: string[],
    fallbackConfig: AllocationConfig,
  ): Promise<AllocatedQuestionDto[]> {
    const totalQuestions = section.questionCount;
    if (totalQuestions <= 0) return [];

    const diffConfig =
      section.difficultyDistribution || fallbackConfig.distribution;
    const easyCount = Math.round((diffConfig.EASY / 100) * totalQuestions);
    const hardCount = Math.round((diffConfig.HARD / 100) * totalQuestions);
    const mediumCount = Math.max(0, totalQuestions - easyCount - hardCount);

    const difficulties = [
      { level: DifficultyLevel.EASY, count: easyCount },
      { level: DifficultyLevel.MEDIUM, count: mediumCount },
      { level: DifficultyLevel.HARD, count: hardCount },
    ];

    const allocatedQuestions: AllocatedQuestionDto[] = [];
    let orderCounter = 1;

    for (const diff of difficulties) {
      if (diff.count <= 0) continue;

      let remainingDiffCount = diff.count;

      for (const topicAlloc of section.topicAllocations) {
        // Allocate proportionally by topic
        const topicCount = Math.round(
          (topicAlloc.percentage / 100) * diff.count,
        );
        if (topicCount <= 0) continue;

        const questions = await this.questionSource.fetchQuestions({
          conceptKey: topicAlloc.topicId,
          difficultyLevel: diff.level,
          limit: topicCount * 5,
          excludeIds: Array.from(allocatedQuestionIds),
        });

        const filteredQuestions = await this.antiRepetitionService.filterPool(
          questions,
          historyIds,
          Array.from(allocatedQuestionIds),
        );

        if (filteredQuestions.length < topicCount) {
          throw new InternalServerErrorException(
            `Insufficient questions for topic ${topicAlloc.topicId} at difficulty ${diff.level}. Required: ${topicCount}, Found: ${filteredQuestions.length}`,
          );
        }

        const selected = filteredQuestions.slice(0, topicCount);
        for (const q of selected) {
          allocatedQuestionIds.add(q.id);
          allocatedQuestions.push({
            questionId: q.id,
            questionHash: q.questionHash || "hash",
            conceptKey: q.conceptKey,
            difficultyLevel: q.difficultyLevel,
            questionType: q.questionType,
            questionOrder: orderCounter++,
            questionSnapshot: q,
          });
          remainingDiffCount--;
        }
      }

      // If rounding caused a shortfall in this difficulty bucket, grab extra from the first topic
      if (remainingDiffCount > 0 && section.topicAllocations.length > 0) {
        const extraTopic = section.topicAllocations[0];
        const extraQuestions = await this.questionSource.fetchQuestions({
          conceptKey: extraTopic.topicId,
          difficultyLevel: diff.level,
          limit: remainingDiffCount * 5,
          excludeIds: Array.from(allocatedQuestionIds),
        });
        const filteredExtra = await this.antiRepetitionService.filterPool(
          extraQuestions,
          historyIds,
          Array.from(allocatedQuestionIds),
        );

        if (filteredExtra.length < remainingDiffCount) {
          throw new InternalServerErrorException(
            `Insufficient extra questions for difficulty ${diff.level}`,
          );
        }

        const selectedExtra = filteredExtra.slice(0, remainingDiffCount);
        for (const q of selectedExtra) {
          allocatedQuestionIds.add(q.id);
          allocatedQuestions.push({
            questionId: q.id,
            questionHash: q.questionHash || "hash",
            conceptKey: q.conceptKey,
            difficultyLevel: q.difficultyLevel,
            questionType: q.questionType,
            questionOrder: orderCounter++,
            questionSnapshot: q,
          });
          remainingDiffCount--;
        }
      }
    }

    if (allocatedQuestions.length !== totalQuestions) {
      throw new InternalServerErrorException(
        `Allocation mismatch: expected ${totalQuestions}, got ${allocatedQuestions.length}`,
      );
    }

    return allocatedQuestions;
  }
}
