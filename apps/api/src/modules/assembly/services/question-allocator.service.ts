import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
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

    const allocatedQuestions: AllocatedQuestionDto[] = [];
    let orderCounter = 1;

    const diffConfig =
      section.difficultyDistribution || fallbackConfig.distribution;

    const isFlexible =
      !diffConfig ||
      (diffConfig.EASY === 0 &&
        diffConfig.MEDIUM === 0 &&
        diffConfig.HARD === 0);

    let easyCount = 0;
    let mediumCount = 0;
    let hardCount = 0;

    if (isFlexible) {
      // In Flexible Mode, delegate to Natural Ratio Engine without forcing rigid 33/34/33 difficulty quotas
      let remainingSectionCount = totalQuestions;

      for (let i = 0; i < section.topicAllocations.length; i++) {
        if (remainingSectionCount <= 0) break;
        const topicAlloc = section.topicAllocations[i];
        const isLast = i === section.topicAllocations.length - 1;

        const rawCount = Math.round((topicAlloc.percentage / 100) * totalQuestions) || remainingSectionCount;
        const topicCount = isLast ? remainingSectionCount : Math.min(rawCount, remainingSectionCount);
        if (topicCount <= 0) continue;

        const currentlyExcludedIds = new Set<string>(allocatedQuestionIds);
        const selectedForTopic: AllocatedQuestionDto[] = [];

        // Fetch using Natural Ratio ({ EASY: 0, MEDIUM: 0, HARD: 0 })
        const questions = await this.questionSource.fetchQuestions({
          conceptKey: topicAlloc.topicId,
          difficultyLevel: undefined,
          limit: topicCount * 5,
          excludeIds: Array.from(currentlyExcludedIds),
          examId,
        });

        const filtered = await this.antiRepetitionService.filterPool(
          questions,
          historyIds,
          Array.from(allocatedQuestionIds),
        );

        const selected = filtered.slice(0, topicCount);
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
          remainingSectionCount--;
        }

        if (selectedForTopic.length < topicCount) {
          const sectionName = (section as any).displayName || (section as any).name || section.sectionKey || "Section";
          const topicName = (topicAlloc as any).topicName || topicAlloc.topicId;
          const deficit = topicCount - selectedForTopic.length;
          throw new BadRequestException({
            error: "INSUFFICIENT_ELIGIBLE_QUESTIONS",
            message: `Assembly Blocked: Missing ${deficit} question(s) for topic '${topicName}' in section '${sectionName}'. Please create new questions for this topic in the Question Bank!`,
            details: {
              section: sectionName,
              topic: topicName,
              required: topicCount,
              available: selectedForTopic.length,
              deficit,
            },
          });
        }
      }
      return allocatedQuestions;
    }

    easyCount = Math.round((diffConfig.EASY / 100) * totalQuestions);
    hardCount = Math.round((diffConfig.HARD / 100) * totalQuestions);
    mediumCount = Math.max(0, totalQuestions - easyCount - hardCount);

    const difficulties = [
      { level: DifficultyLevel.EASY, count: easyCount },
      { level: DifficultyLevel.MEDIUM, count: mediumCount },
      { level: DifficultyLevel.HARD, count: hardCount },
    ];

    for (const diff of difficulties) {
      if (diff.count <= 0) continue;

      // remainingDiffCount tracks how many questions are still owed for this difficulty level.
      // Capping per-topic slices against this prevents Math.round() overshoot within a bucket.
      let remainingDiffCount = diff.count;

      for (const topicAlloc of section.topicAllocations) {
        if (remainingDiffCount <= 0) break;

        // Proportional topic slice, capped against the remaining bucket budget.
        const proportionalCount = Math.round(
          (topicAlloc.percentage / 100) * diff.count,
        );
        const topicCount = Math.min(proportionalCount, remainingDiffCount);
        if (topicCount <= 0) continue;

        let attempts = 0;
        const maxAttempts = 3;
        const currentlyExcludedIds = new Set<string>(allocatedQuestionIds);
        const selectedForTopic: AllocatedQuestionDto[] = [];
        const requiredForTopic = topicCount;

        while (
          selectedForTopic.length < requiredForTopic &&
          attempts < maxAttempts
        ) {
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

          // Cap against the per-topic shortage and the remaining bucket budget.
          const bucketRemaining = remainingDiffCount - selectedForTopic.length;
          const toAddCount = Math.min(shortage, filteredQuestions.length, bucketRemaining);
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
          const fallbackLevels: DifficultyLevel[] = [
            DifficultyLevel.EASY,
            DifficultyLevel.MEDIUM,
            DifficultyLevel.HARD,
          ].filter((lvl) => lvl !== diff.level);

          for (const fallbackLevel of fallbackLevels) {
            if (selectedForTopic.length >= requiredForTopic) break;
            const shortage = requiredForTopic - selectedForTopic.length;

            try {
              const fallbackQuestions =
                await this.questionSource.fetchQuestions({
                  conceptKey: topicAlloc.topicId,
                  difficultyLevel: fallbackLevel,
                  limit: shortage * 5,
                  excludeIds: Array.from(currentlyExcludedIds),
                  examId,
                });

              for (const q of fallbackQuestions) {
                currentlyExcludedIds.add(q.id);
              }

              const filtered = await this.antiRepetitionService.filterPool(
                fallbackQuestions,
                historyIds,
                Array.from(allocatedQuestionIds),
              );

              const bucketCap = Math.max(1, shortage);
              const toAdd = filtered.slice(0, Math.min(shortage, bucketCap));
              for (const q of toAdd) {
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
            } catch (err) {
              // ignore fallback error and try next difficulty level
            }
          }
        }

        if (selectedForTopic.length < requiredForTopic) {
          const sectionName = (section as any).displayName || (section as any).name || section.sectionKey || "Section";
          const topicName = (topicAlloc as any).topicName || topicAlloc.topicId;
          const deficit = requiredForTopic - selectedForTopic.length;
          throw new BadRequestException({
            error: "INSUFFICIENT_ELIGIBLE_QUESTIONS",
            message: `Assembly Blocked: Missing ${deficit} ${diff.level} question(s) for topic '${topicName}' in section '${sectionName}'. Please create new ${diff.level} question(s) for this topic in the Question Bank!`,
            details: {
              section: sectionName,
              topic: topicName,
              difficulty: diff.level,
              required: requiredForTopic,
              available: selectedForTopic.length,
              deficit,
            },
          });
        }
      }

      // If rounding caused a shortfall in this difficulty bucket, grab extra from the first topic.
      if (remainingDiffCount > 0 && section.topicAllocations.length > 0) {
        const extraTopic = section.topicAllocations[0];
        let attempts = 0;
        const maxAttempts = 3;
        const currentlyExcludedIds = new Set<string>(allocatedQuestionIds);
        const selectedForExtra: AllocatedQuestionDto[] = [];
        const requiredForExtra = remainingDiffCount;

        while (
          selectedForExtra.length < requiredForExtra &&
          attempts < maxAttempts
        ) {
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
          const fallbackLevels: DifficultyLevel[] = [
            DifficultyLevel.EASY,
            DifficultyLevel.MEDIUM,
            DifficultyLevel.HARD,
          ].filter((lvl) => lvl !== diff.level);

          for (const fallbackLevel of fallbackLevels) {
            if (selectedForExtra.length >= requiredForExtra) break;
            const shortage = requiredForExtra - selectedForExtra.length;

            try {
              const fallbackExtra = await this.questionSource.fetchQuestions({
                conceptKey: extraTopic.topicId,
                difficultyLevel: fallbackLevel,
                limit: shortage * 5,
                excludeIds: Array.from(currentlyExcludedIds),
                examId,
              });

              for (const q of fallbackExtra) {
                currentlyExcludedIds.add(q.id);
              }

              const filteredExtra = await this.antiRepetitionService.filterPool(
                fallbackExtra,
                historyIds,
                Array.from(allocatedQuestionIds),
              );

              const toAdd = filteredExtra.slice(0, shortage);
              for (const q of toAdd) {
                allocatedQuestionIds.add(q.id);
                const allocatedQ = {
                  questionId: q.id,
                  questionHash: q.questionHash || "hash",
                  conceptKey: q.conceptKey,
                  difficultyLevel: diff.level,
                  questionType: q.questionType,
                  questionOrder: orderCounter++,
                  questionSnapshot: q,
                };
                selectedForExtra.push(allocatedQ);
                allocatedQuestions.push(allocatedQ);
                remainingDiffCount--;
              }
            } catch (err) {
              // ignore fallback error
            }
          }
        }

        if (selectedForExtra.length < requiredForExtra) {
          throw new BadRequestException({
            error: "INSUFFICIENT_ELIGIBLE_QUESTIONS",
            message: `Unable to assemble this assessment because there are not enough eligible questions for the extra ${extraTopic.topicId} / ${diff.level} requirement.`,
            details: {
              section:
                (section as any).displayName || section.sectionKey || "section",
              topic: extraTopic.topicId,
              difficulty: diff.level,
              required: requiredForExtra,
              available: selectedForExtra.length,
            },
          });
        }
      }
    }

    // Safety net: trim any 1-off overshoot from edge-case rounding combinations.
    if (allocatedQuestions.length > totalQuestions) {
      allocatedQuestions.splice(totalQuestions);
    }

    if (allocatedQuestions.length !== totalQuestions) {
      throw new InternalServerErrorException(
        `Allocation mismatch: expected ${totalQuestions}, got ${allocatedQuestions.length}`,
      );
    }

    return allocatedQuestions;
  }
}
