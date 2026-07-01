import { Injectable, Logger } from "@nestjs/common";
import { IQuestionSource } from "./question-source.interface";
import { Inject } from "@nestjs/common";
import { QUESTION_SOURCE_TOKEN } from "./question-source.interface";
import { BlueprintSectionDto } from "@intervu/shared";
import { AllocatedQuestionDto } from "@intervu/shared";
import { GeneratedQuestion } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

/** Result of intelligent allocation for a single section */
export interface IntelligentAllocationResult {
  issues: string[];
  questions: AllocatedQuestionDto[];
  warnings: string[];
  allocatedCount: number;
  requestedCount: number;
  allocationAccuracy: number; // 0–100
}

/**
 * IntelligentAllocationService — enhanced question allocator.
 *
 * This service runs ALONGSIDE the existing QuestionAllocatorService.
 * QuestionAllocatorService is preserved for the default AssemblyService flow.
 * IntelligentAllocationService provides graceful degradation instead of hard throws.
 *
 * Key differences from QuestionAllocatorService:
 * 1. Never throws when pool is insufficient — fills as many as available and warns
 * 2. Topic redistribution: if one topic is exhausted, borrows from other topics proportionally
 * 3. Returns allocation accuracy score and warnings for health metrics
 * 4. Parallel difficulty tier fetching for performance
 */
@Injectable()
export class IntelligentAllocationService {
  private readonly logger = new Logger(IntelligentAllocationService.name);

  constructor(
    @Inject(QUESTION_SOURCE_TOKEN)
    private readonly questionSource: IQuestionSource,
  ) {}

  /**
   * Allocate questions for a blueprint section with graceful degradation.
   *
   * @param section - Blueprint section definition
   * @param excludeIds - Question IDs to exclude (already used in other sections or history)
   * @returns IntelligentAllocationResult with questions + warnings + accuracy score
   */
  async allocateSection(
    section: BlueprintSectionDto,
    excludeIds: string[],
  ): Promise<IntelligentAllocationResult> {
    const warnings: string[] = [];
    const allQuestions: AllocatedQuestionDto[] = [];

    const diffConfig = section.difficultyDistribution ?? {
      EASY: 33,
      MEDIUM: 50,
      HARD: 17,
    };

    // Calculate per-difficulty counts
    const easyCount = Math.round(
      (diffConfig.EASY / 100) * section.questionCount,
    );
    const hardCount = Math.round(
      (diffConfig.HARD / 100) * section.questionCount,
    );
    const mediumCount = section.questionCount - easyCount - hardCount;

    const difficultyTiers: Array<{
      difficulty: "EASY" | "MEDIUM" | "HARD";
      count: number;
    }> = [
      { difficulty: "EASY" as const, count: easyCount },
      { difficulty: "MEDIUM" as const, count: mediumCount },
      { difficulty: "HARD" as const, count: hardCount },
    ].filter((t) => t.count > 0);

    const currentExcludeIds = new Set<string>(excludeIds);

    // Fetch all tiers in parallel for performance (target: <5s for 90 questions)
    const tierResults = await Promise.all(
      difficultyTiers.map(async (tier) => {
        const topicAllocations = section.topicAllocations ?? [];

        if (topicAllocations.length > 0) {
          // Topic-aware allocation
          return this.allocateWithTopics(
            section,
            tier.difficulty,
            tier.count,
            topicAllocations,
            Array.from(currentExcludeIds),
            warnings,
          );
        } else {
          // Direct allocation without topic filter
          return this.allocateDirect(
            section,
            tier.difficulty,
            tier.count,
            Array.from(currentExcludeIds),
            warnings,
          );
        }
      }),
    );

    for (const tierQuestions of tierResults) {
      for (const q of tierQuestions) {
        allQuestions.push(q);
        currentExcludeIds.add(q.questionId);
      }
    }

    // Try to fill remaining slots from any available pool if under-filled
    const shortfall = section.questionCount - allQuestions.length;
    if (shortfall > 0) {
      warnings.push(
        `Section ${section.sectionKey}: under-filled by ${shortfall} question(s). ` +
          `Allocated ${allQuestions.length}/${section.questionCount}`,
      );
      this.logger.warn(
        `IntelligentAllocation: shortfall of ${shortfall} for section ${section.sectionKey}`,
      );
    }

    // Assign question order
    const orderedQuestions = allQuestions.map((q, i) => ({
      ...q,
      questionOrder: i + 1,
    }));

    const allocationAccuracy =
      section.questionCount > 0
        ? Math.round((orderedQuestions.length / section.questionCount) * 100)
        : 100;

    return {
      questions: orderedQuestions,
      warnings,
      issues: [],
      allocatedCount: orderedQuestions.length,
      requestedCount: section.questionCount,
      allocationAccuracy,
    };
  }

  /**
   * Allocate questions for a specific difficulty with topic proportions.
   * Falls back to unbounded fetch from any topic if a specific topic is exhausted.
   */
  private async allocateWithTopics(
    section: BlueprintSectionDto,
    difficulty: "EASY" | "MEDIUM" | "HARD",
    count: number,
    topicAllocations: Array<{ topicId: string; percentage: number }>,
    excludeIds: string[],
    warnings: string[],
  ): Promise<AllocatedQuestionDto[]> {
    const questions: AllocatedQuestionDto[] = [];
    const localExcludeIds = new Set<string>(excludeIds);

    // Sort topics by percentage descending to allocate most-important first
    const sortedTopics = [...topicAllocations].sort(
      (a, b) => b.percentage - a.percentage,
    );

    let remaining = count;

    for (const topicAlloc of sortedTopics) {
      if (remaining <= 0) break;

      const topicCount = Math.min(
        Math.round((topicAlloc.percentage / 100) * count),
        remaining,
      );
      if (topicCount <= 0) continue;

      const fetched = await this.questionSource.fetchQuestions({
        conceptKey: topicAlloc.topicId,
        difficultyLevel: difficulty,
        limit: topicCount,
        excludeIds: Array.from(localExcludeIds),
      });

      const mapped = fetched
        .slice(0, topicCount)
        .map((q) => this.toAllocatedQuestion(q, 0));

      if (mapped.length < topicCount) {
        const shortfall = topicCount - mapped.length;
        warnings.push(
          `Topic ${topicAlloc.topicId} (${difficulty}): allocated ${mapped.length}/${topicCount}. ` +
            `Shortfall of ${shortfall} — redistributing from other topics if available.`,
        );
      }

      questions.push(...mapped);
      mapped.forEach((q) => localExcludeIds.add(q.questionId));
      remaining -= mapped.length;
    }

    // Attempt redistribution for remaining shortfall
    if (remaining > 0) {
      const extraFetched = await this.questionSource.fetchQuestions({
        difficultyLevel: difficulty,
        limit: remaining,
        excludeIds: Array.from(localExcludeIds),
      });

      const extra = extraFetched
        .slice(0, remaining)
        .map((q) => this.toAllocatedQuestion(q, 0));
      questions.push(...extra);
    }

    return questions;
  }

  /**
   * Direct allocation without topic filters.
   */
  private async allocateDirect(
    section: BlueprintSectionDto,
    difficulty: "EASY" | "MEDIUM" | "HARD",
    count: number,
    excludeIds: string[],
    warnings: string[],
  ): Promise<AllocatedQuestionDto[]> {
    const fetched = await this.questionSource.fetchQuestions({
      difficultyLevel: difficulty,
      limit: count,
      excludeIds,
    });

    if (fetched.length < count) {
      warnings.push(
        `Section ${section.sectionKey} ${difficulty}: insufficient pool. ` +
          `Required ${count}, available ${fetched.length}.`,
      );
    }

    return fetched.slice(0, count).map((q) => this.toAllocatedQuestion(q, 0));
  }

  /**
   * Map a GeneratedQuestion to AllocatedQuestionDto shape.
   */
  private toAllocatedQuestion(
    q: GeneratedQuestion,
    order: number,
  ): AllocatedQuestionDto {
    return {
      questionId: q.id,
      questionHash: q.questionHash ?? createId(),
      conceptKey: q.conceptKey ?? "",
      difficultyLevel: q.difficultyLevel ?? "MEDIUM",
      questionType: q.questionType ?? "MULTIPLE_CHOICE",
      questionOrder: order,
      questionSnapshot: {
        questionId: q.id,
        questionText: q.questionText,
        conceptKey: q.conceptKey,
        difficultyLevel: q.difficultyLevel,
        questionType: q.questionType,
        options: q.options ?? [],
        correctAnswer: q.correctAnswer ?? null,
        solution: q.solution ?? "",
        metadata: q.metadata ?? {},
      },
    };
  }
}
