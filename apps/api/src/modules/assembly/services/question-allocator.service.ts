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

interface DifficultyTargetMap {
  EASY: number;
  MEDIUM: number;
  HARD: number;
}

@Injectable()
export class QuestionAllocatorService {
  constructor(
    @Inject(QUESTION_SOURCE_TOKEN)
    private readonly questionSource: IQuestionSource,
    private readonly antiRepetitionService: AntiRepetitionService,
  ) {}

  private calculateSectionDifficultyTargets(
    totalQuestions: number,
    diffConfig: AllocationConfig["distribution"],
  ): DifficultyTargetMap {
    const isFlexible =
      !diffConfig ||
      (diffConfig.EASY === 0 && diffConfig.MEDIUM === 0 && diffConfig.HARD === 0);

    if (isFlexible) {
      const easyCount = Math.round(totalQuestions / 3);
      const hardCount = Math.round(totalQuestions / 3);
      const mediumCount = Math.max(0, totalQuestions - easyCount - hardCount);
      return {
        EASY: easyCount,
        MEDIUM: mediumCount,
        HARD: hardCount,
      };
    }

    const easyCount = Math.round((diffConfig.EASY / 100) * totalQuestions);
    const hardCount = Math.round((diffConfig.HARD / 100) * totalQuestions);
    const mediumCount = Math.max(0, totalQuestions - easyCount - hardCount);

    return {
      EASY: easyCount,
      MEDIUM: mediumCount,
      HARD: hardCount,
    };
  }

  private calculateSectionTopicQuotas(
    totalQuestions: number,
    topicAllocations: BlueprintSectionDto["topicAllocations"],
  ): Map<string, number> {
    if (topicAllocations.length === 0) {
      return new Map();
    }

    const totalPercentage = topicAllocations.reduce(
      (sum, topicAlloc) => sum + (topicAlloc.percentage || 0),
      0,
    );

    const normalizedTopics = topicAllocations.map((topicAlloc) => {
      const safePercentage = topicAlloc.percentage || 0;
      const normalizedPercentage =
        totalPercentage > 0 ? (safePercentage / totalPercentage) * 100 : 100 / topicAllocations.length;
      return {
        topicId: topicAlloc.topicId,
        percentage: normalizedPercentage,
      };
    });

    const rawQuotas = normalizedTopics.map((topicAlloc) => ({
      topicId: topicAlloc.topicId,
      rawQuota: (topicAlloc.percentage / 100) * totalQuestions,
    }));

    const floorQuotas = new Map<string, number>();
    let remainingQuestions = totalQuestions;

    for (const rawQuota of rawQuotas) {
      const floor = Math.floor(rawQuota.rawQuota);
      floorQuotas.set(rawQuota.topicId, floor);
      remainingQuestions -= floor;
    }

    const sortedRemainders = rawQuotas
      .map((rawQuota) => ({
        topicId: rawQuota.topicId,
        remainder: rawQuota.rawQuota - Math.floor(rawQuota.rawQuota),
      }))
      .sort((a, b) => b.remainder - a.remainder || a.topicId.localeCompare(b.topicId));

    for (let i = 0; i < remainingQuestions; i++) {
      const nextTopic = sortedRemainders[i % sortedRemainders.length];
      if (!nextTopic) break;
      floorQuotas.set(nextTopic.topicId, (floorQuotas.get(nextTopic.topicId) || 0) + 1);
    }

    return floorQuotas;
  }

  private buildTopicDifficultyPlan(
    section: BlueprintSectionDto,
    topicQuotas: Map<string, number>,
    sectionDifficultyTargets: DifficultyTargetMap,
  ): Map<string, DifficultyTargetMap> {
    const topicPlans = new Map<string, DifficultyTargetMap>();
    const remainingDifficulty = { ...sectionDifficultyTargets };

    const difficulties: Array<{
      level: DifficultyLevel;
      percentage: number;
    }> = [
      { level: DifficultyLevel.EASY, percentage: section.difficultyDistribution?.EASY ?? 0 },
      { level: DifficultyLevel.MEDIUM, percentage: section.difficultyDistribution?.MEDIUM ?? 0 },
      { level: DifficultyLevel.HARD, percentage: section.difficultyDistribution?.HARD ?? 0 },
    ].filter((entry) => entry.percentage > 0);

    if (difficulties.length === 0) {
      difficulties.push(
        { level: DifficultyLevel.EASY, percentage: 40 },
        { level: DifficultyLevel.MEDIUM, percentage: 40 },
        { level: DifficultyLevel.HARD, percentage: 20 },
      );
    }

    const topicEntries = section.topicAllocations
      .map((topicAlloc) => {
        const quota = topicQuotas.get(topicAlloc.topicId) || 0;
        const rawTargets = difficulties.reduce(
          (acc, diff) => {
            acc[diff.level] = (quota * diff.percentage) / 100;
            return acc;
          },
          {} as Record<DifficultyLevel, number>,
        );

        const floors = difficulties.reduce(
          (acc, diff) => {
            acc[diff.level] = Math.floor(rawTargets[diff.level]);
            return acc;
          },
          {} as Record<DifficultyLevel, number>,
        );

        return {
          topicId: topicAlloc.topicId,
          quota,
          rawTargets,
          floors,
          remainder: difficulties.map((diff) => ({
            level: diff.level,
            value: rawTargets[diff.level] - floors[diff.level],
          })),
        };
      })
      .sort((a, b) => b.quota - a.quota || a.topicId.localeCompare(b.topicId));

    for (const topicEntry of topicEntries) {
      const topicPlan: DifficultyTargetMap = {
        EASY: 0,
        MEDIUM: 0,
        HARD: 0,
      };

      let topicRemaining = topicEntry.quota;

      for (const diff of difficulties) {
        const floor = topicEntry.floors[diff.level] || 0;
        const assignable = Math.min(floor, remainingDifficulty[diff.level], topicRemaining);
        topicPlan[diff.level] += assignable;
        remainingDifficulty[diff.level] -= assignable;
        topicRemaining -= assignable;
      }

      const remainders = [...topicEntry.remainder].sort(
        (a, b) => b.value - a.value || a.level.localeCompare(b.level),
      );

      while (topicRemaining > 0) {
        const nextDiff = remainders.find(
          (item) => (remainingDifficulty[item.level] || 0) > 0,
        );

        if (!nextDiff) {
          break;
        }

        topicPlan[nextDiff.level] += 1;
        remainingDifficulty[nextDiff.level] -= 1;
        topicRemaining -= 1;
      }

      if (topicRemaining > 0) {
        const fallbackDiffs = difficulties
          .map((diff) => diff.level)
          .filter((diff) => (remainingDifficulty[diff] || 0) > 0);

        while (topicRemaining > 0 && fallbackDiffs.length > 0) {
          const diffLevel = fallbackDiffs[0];
          topicPlan[diffLevel] += 1;
          remainingDifficulty[diffLevel] -= 1;
          topicRemaining -= 1;
        }
      }

      if (topicRemaining > 0) {
        throw new BadRequestException({
          error: "INSUFFICIENT_ELIGIBLE_QUESTIONS",
          message: `Unable to assemble this assessment because the section-level quota for topic ${topicEntry.topicId} cannot be satisfied within the remaining difficulty budget.`,
          details: {
            topic: topicEntry.topicId,
            required: topicEntry.quota,
            available: topicPlan.EASY + topicPlan.MEDIUM + topicPlan.HARD,
          },
        });
      }

      topicPlans.set(topicEntry.topicId, topicPlan);
    }

    return topicPlans;
  }

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

    const sectionDifficultyTargets = this.calculateSectionDifficultyTargets(
      totalQuestions,
      diffConfig,
    );

    const topicQuotas = this.calculateSectionTopicQuotas(
      totalQuestions,
      section.topicAllocations,
    );

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
    const topicDifficultyPlan = this.buildTopicDifficultyPlan(
      section,
      topicQuotas,
      sectionDifficultyTargets,
    );

    easyCount = Math.round((diffConfig.EASY / 100) * totalQuestions);
    hardCount = Math.round((diffConfig.HARD / 100) * totalQuestions);
    mediumCount = Math.max(0, totalQuestions - easyCount - hardCount);

    const difficulties = [
      { level: DifficultyLevel.EASY, count: sectionDifficultyTargets.EASY },
      { level: DifficultyLevel.MEDIUM, count: sectionDifficultyTargets.MEDIUM },
      { level: DifficultyLevel.HARD, count: sectionDifficultyTargets.HARD },
    ];

    const allocatedQuestions: AllocatedQuestionDto[] = [];
    let orderCounter = 1;

    for (const topicAlloc of section.topicAllocations) {
      const topicQuota = topicQuotas.get(topicAlloc.topicId) || 0;
      const topicDifficultyTargets = topicDifficultyPlan.get(topicAlloc.topicId);

      if (!topicDifficultyTargets || topicQuota <= 0) {
        continue;
      }

      for (const diff of difficulties) {
        const requiredForTopic = topicDifficultyTargets[diff.level];
        if (requiredForTopic <= 0) continue;

        let attempts = 0;
        const maxAttempts = 3;
        const currentlyExcludedIds = new Set<string>(allocatedQuestionIds);
        const selectedForTopic: AllocatedQuestionDto[] = [];

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
    }

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
