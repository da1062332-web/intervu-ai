import { Injectable, InternalServerErrorException, BadRequestException } from "@nestjs/common";
import { BlueprintSectionDto } from "@intervu/shared";
import { AllocatedQuestionDto } from "@intervu/shared";

import { AntiRepetitionService } from "./anti-repetition.service";
import { DifficultyLevel } from "@prisma/client";
import {
  IQuestionSource,
  QUESTION_SOURCE_TOKEN,
} from "./question-source.interface";
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
    examId?: string,
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

        let attempts = 0;
        const maxAttempts = 3;
        const currentlyExcludedIds = new Set<string>(allocatedQuestionIds);
        const selectedForTopic: AllocatedQuestionDto[] = [];
        const requiredForTopic = topicCount;

        while (selectedForTopic.length < requiredForTopic && attempts < maxAttempts) {
          const shortage = requiredForTopic - selectedForTopic.length;
          
          const questions = await this.questionSource.fetchQuestions({
            conceptKey: topicAlloc.topicId,
            difficultyLevel: diff.level,
            limit: shortage * 5,
            excludeIds: Array.from(currentlyExcludedIds),
            examId,
          });

          for (const q of questions) {
            currentlyExcludedIds.add(q.id);
          }

          const filteredQuestions = await this.antiRepetitionService.filterPool(
            questions,
            historyIds,
            Array.from(allocatedQuestionIds),
          );

          const toAddCount = Math.min(shortage, filteredQuestions.length);
          const selected = filteredQuestions.slice(0, toAddCount);
          
          for (const q of selected) {
            allocatedQuestionIds.add(q.id);
            const allocatedQ = {
              questionId: q.id,
              questionHash: q.questionHash || "hash",
              conceptKey: q.conceptKey,
              difficultyLevel: q.difficultyLevel,
              questionType: q.questionType,
              questionOrder: orderCounter++,
              questionSnapshot: q,
            };
            selectedForTopic.push(allocatedQ);
            allocatedQuestions.push(allocatedQ);
            remainingDiffCount--;
          }
          
          attempts++;
        }

        if (selectedForTopic.length < requiredForTopic) {
          throw new BadRequestException({
            error: 'INSUFFICIENT_ELIGIBLE_QUESTIONS',
            message: `Unable to assemble this assessment because there are not enough eligible questions for the ${topicAlloc.topicId} / ${diff.level} requirement.`,
            details: {
              section: (section as any).displayName || section.sectionKey || 'section',
              topic: topicAlloc.topicId,
              difficulty: diff.level,
              required: requiredForTopic,
              available: selectedForTopic.length
            }
          });
        }
      }

      // If rounding caused a shortfall in this difficulty bucket, grab extra from the first topic
      if (remainingDiffCount > 0 && section.topicAllocations.length > 0) {
        const extraTopic = section.topicAllocations[0];
        let attempts = 0;
        const maxAttempts = 3;
        const currentlyExcludedIds = new Set<string>(allocatedQuestionIds);
        const selectedForExtra: AllocatedQuestionDto[] = [];
        const requiredForExtra = remainingDiffCount;

        while (selectedForExtra.length < requiredForExtra && attempts < maxAttempts) {
          const shortage = requiredForExtra - selectedForExtra.length;
          
          const extraQuestions = await this.questionSource.fetchQuestions({
            conceptKey: extraTopic.topicId,
            difficultyLevel: diff.level,
            limit: shortage * 5,
            excludeIds: Array.from(currentlyExcludedIds),
            examId,
          });

          for (const q of extraQuestions) {
            currentlyExcludedIds.add(q.id);
          }

          const filteredExtra = await this.antiRepetitionService.filterPool(
            extraQuestions,
            historyIds,
            Array.from(allocatedQuestionIds),
          );

          const toAddCount = Math.min(shortage, filteredExtra.length);
          const selectedExtra = filteredExtra.slice(0, toAddCount);
          
          for (const q of selectedExtra) {
            allocatedQuestionIds.add(q.id);
            const allocatedQ = {
              questionId: q.id,
              questionHash: q.questionHash || "hash",
              conceptKey: q.conceptKey,
              difficultyLevel: q.difficultyLevel,
              questionType: q.questionType,
              questionOrder: orderCounter++,
              questionSnapshot: q,
            };
            selectedForExtra.push(allocatedQ);
            allocatedQuestions.push(allocatedQ);
            remainingDiffCount--;
          }
          
          attempts++;
        }

        if (selectedForExtra.length < requiredForExtra) {
          throw new BadRequestException({
            error: 'INSUFFICIENT_ELIGIBLE_QUESTIONS',
            message: `Unable to assemble this assessment because there are not enough eligible questions for the extra ${extraTopic.topicId} / ${diff.level} requirement.`,
            details: {
              section: (section as any).displayName || section.sectionKey || 'section',
              topic: extraTopic.topicId,
              difficulty: diff.level,
              required: requiredForExtra,
              available: selectedForExtra.length
            }
          });
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
