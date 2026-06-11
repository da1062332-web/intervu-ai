import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BlueprintSectionDto } from './dto/blueprint.dto';
import { AllocatedQuestionDto } from './dto/allocated-question.dto';
import { QuestionPoolService } from '../question-pool/services/question-pool.service';
import { DifficultyLevel } from '@prisma/client';

export interface AllocationConfig {
  distribution: {
    EASY: number;
    MEDIUM: number;
    HARD: number;
  };
}

@Injectable()
export class QuestionAllocatorService {
  constructor(private readonly questionPoolService: QuestionPoolService) {}

  async allocateQuestions(
    section: BlueprintSectionDto,
    allocatedQuestionIds: Set<string>,
    config: AllocationConfig
  ): Promise<AllocatedQuestionDto[]> {
    const totalQuestions = section.questionCount;
    if (totalQuestions <= 0) return [];

    const easyCount = Math.round((config.distribution.EASY / 100) * totalQuestions);
    const hardCount = Math.round((config.distribution.HARD / 100) * totalQuestions);
    let mediumCount = totalQuestions - easyCount - hardCount;

    // Handle edge cases where mediumCount might become negative due to rounding (though mathematically rare with standard percentages)
    if (mediumCount < 0) {
      mediumCount = 0;
    }

    const allocations = [
      { level: DifficultyLevel.EASY, count: easyCount },
      { level: DifficultyLevel.MEDIUM, count: mediumCount },
      { level: DifficultyLevel.HARD, count: hardCount },
    ];

    const allocatedQuestions: AllocatedQuestionDto[] = [];
    let orderCounter = 1;

    for (const alloc of allocations) {
      if (alloc.count <= 0) continue;

      const questions = await this.questionPoolService.findAvailableQuestions(
        alloc.level,
        Array.from(allocatedQuestionIds),
        alloc.count
      );

      if (questions.length < alloc.count) {
        throw new InternalServerErrorException(
          `Insufficient questions available for difficulty ${alloc.level}. Required: ${alloc.count}, Found: ${questions.length}`
        );
      }

      for (const q of questions) {
        if (allocatedQuestionIds.has(q.id)) {
          throw new InternalServerErrorException('Duplicate question detected during allocation');
        }
        
        allocatedQuestionIds.add(q.id);
        
        allocatedQuestions.push({
          questionId: q.id,
          questionHash: q.questionHash,
          conceptKey: q.conceptKey,
          difficultyLevel: q.difficultyLevel,
          questionType: q.questionType,
          questionOrder: orderCounter++,
          questionSnapshot: q,
        });
      }
    }

    if (allocatedQuestions.length !== totalQuestions) {
       throw new InternalServerErrorException(
         `Allocation mismatch: expected ${totalQuestions}, got ${allocatedQuestions.length}`
       );
    }

    return allocatedQuestions;
  }
}
