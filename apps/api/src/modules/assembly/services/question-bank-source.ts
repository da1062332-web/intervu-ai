import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { IQuestionSource, QuestionFilters } from "./question-source.interface";
import { QuestionRotationService } from "../../question-bank/services/question-rotation.service";
import { QuestionPoolRepository } from "../repositories/question-pool.repository";
import { GeneratedQuestion } from "@prisma/client";
import { AssemblyProviderRequest } from "@intervu-ai/contracts";
import { PrismaService } from "../../../prisma/prisma.service";

/**
 * QuestionBankSource — Production question source adapter.
 *
 * Implements IQuestionSource by wrapping QuestionRotationService (Module 2 / Dev 1).
 * Uses SELECT FOR UPDATE SKIP LOCKED for concurrency-safe retrieval.
 *
 * Fallback strategy: If the real Question bank has no ACTIVE questions for the
 * requested topic/difficulty, falls back to QuestionPoolRepository (GeneratedQuestion
 * table) with a warning log. This ensures graceful degradation during development.
 *
 * Set ENABLE_REAL_QUESTION_BANK=false to force legacy mode.
 */
@Injectable()
export class QuestionBankSource implements IQuestionSource {
  private readonly logger = new Logger(QuestionBankSource.name);

  private readonly useRealBank =
    process.env["ENABLE_REAL_QUESTION_BANK"] !== "false";

  constructor(
    private readonly rotationService: QuestionRotationService,
    private readonly legacyPool: QuestionPoolRepository,
    private readonly prisma: PrismaService,
  ) {}

  async fetchQuestions(filters: QuestionFilters): Promise<GeneratedQuestion[]> {
    const tStart = Date.now();
    const inputConceptKey = (filters.conceptKey || "").replace(/^"|"$/g, "").trim();

    // 1. Resolve UUID, Code, or Name
    let resolvedCode = inputConceptKey;
    let topic = await this.prisma.topic.findUnique({
      where: { id: inputConceptKey },
      include: { concepts: true },
    });
    if (!topic) {
      topic = await this.prisma.topic.findFirst({
        where: {
          OR: [
            { code: inputConceptKey },
            { name: { equals: inputConceptKey, mode: "insensitive" } },
            { name: { contains: inputConceptKey, mode: "insensitive" } },
          ],
        },
        include: { concepts: true },
      });
    }
    if (topic) {
      resolvedCode = topic.code;
    }

    const concept = await this.prisma.concept.findFirst({
      where: { code: resolvedCode.toUpperCase() },
    });
    const resolvedFilters = { ...filters, conceptKey: resolvedCode };
    const limit = filters.limit ?? 10;
    const excludeIds = filters.excludeIds ?? [];
    const topicId = topic?.id || resolvedCode;
    const hasExplicitDifficulty = !!filters.difficultyLevel;
    const difficulty = (filters.difficultyLevel ?? "MEDIUM") as
      | "EASY"
      | "MEDIUM"
      | "HARD";

    const isCodingTopic =
      inputConceptKey.toLowerCase().includes("coding") ||
      (topic?.name && topic.name.toLowerCase().includes("coding")) ||
      filters.questionType === "CODING";

    let effectiveExcludeIds = excludeIds;
    if (isCodingTopic && excludeIds.length > 0) {
      const initialCount = await this.prisma.question.count({
        where: {
          status: "ACTIVE",
          ...(hasExplicitDifficulty ? { difficulty } : {}),
          OR: [
            { questionType: "CODING" },
            { topicId: topicId },
            { topicId: resolvedCode },
            { topic: { name: { contains: "coding", mode: "insensitive" } } },
          ],
          id: { notIn: excludeIds },
        },
      });
      // Allow question re-use for coding questions if strict exclusion yields 0
      if (initialCount === 0) {
        effectiveExcludeIds = [];
      }
    }

    // 1. Calculate available active Manual questions count matching requested difficulty (or all if flexible)
    const manualCount = await this.prisma.question.count({
      where: {
        status: "ACTIVE",
        ...(hasExplicitDifficulty ? { difficulty } : {}),
        OR: [
          ...(isCodingTopic ? [{ questionType: "CODING" }] : []),
          { topicId: topicId },
          { topicId: resolvedCode },
          { concept: { topicId: topicId } },
          { concept: { code: resolvedCode.toUpperCase() } },
        ],
        ...(effectiveExcludeIds.length > 0 ? { id: { notIn: effectiveExcludeIds } } : {}),
      },
    });

    // 2. Calculate available active Templates count matching requested difficulty (or all if flexible)
    const conceptCodes =
      (topic as any)?.concepts?.map((c: any) => c.code) || [];
    const templateCount = await this.prisma.template.count({
      where: {
        isActive: true,
        deletedAt: null,
        ...(hasExplicitDifficulty ? { difficultyLevel: difficulty } : {}),
        OR: [
          {
            conceptKey: {
              in: conceptCodes.length > 0 ? conceptCodes : [resolvedCode],
            },
          },
          { conceptKey: resolvedCode },
          { conceptKey: topicId },
        ],
      },
    });

    const totalPool = manualCount + templateCount;

    // Default: Fallback to legacy template pool if zero pool available
    if (totalPool === 0 || !this.useRealBank) {
      this.logger.warn(
        `Pool count 0 or real bank disabled for topic=${topicId} difficulty=${hasExplicitDifficulty ? difficulty : "FLEXIBLE"}. Using legacy template pool.`,
      );
      return this.fetchFromLegacyPool(resolvedFilters, effectiveExcludeIds, topicId);
    }

    // 3. Calculate Proportional Natural Ratios (Manual vs Template)
    const manualShare = manualCount / totalPool;
    let targetManual = Math.round(limit * manualShare);
    if (targetManual > manualCount) targetManual = manualCount;
    let targetTemplate = limit - targetManual;
    if (targetTemplate > templateCount && manualCount > targetManual) {
      const extraManualNeeded = Math.min(
        manualCount - targetManual,
        targetTemplate - templateCount,
      );
      targetManual += extraManualNeeded;
      targetTemplate = limit - targetManual;
    }

    const assembledResults: GeneratedQuestion[] = [];

    // 4. Fetch Manual Questions according to targetManual
    if (targetManual > 0) {
      const easyShare = Math.floor(targetManual / 3);
      const hardShare = Math.floor(targetManual / 3);
      const medShare = targetManual - easyShare - hardShare;

      const checkDist = hasExplicitDifficulty
        ? {
            EASY: difficulty === "EASY" ? targetManual : 0,
            MEDIUM: difficulty === "MEDIUM" ? targetManual : 0,
            HARD: difficulty === "HARD" ? targetManual : 0,
          }
        : { EASY: targetManual, MEDIUM: targetManual, HARD: targetManual };

      const request: AssemblyProviderRequest = {
        examId: filters.examId || "assembly-source",
        sectionId: topicId,
        count: targetManual,
        difficultyDistribution: checkDist,
        topicIds: topicId ? [topicId] : undefined,
      };

      try {
        const availability =
          await this.rotationService.checkAvailability(request);

        let remainingToTake = targetManual;
        const actualDiffDist = { EASY: 0, MEDIUM: 0, HARD: 0 };

        if (hasExplicitDifficulty) {
          const availForDiff =
            availability?.details?.find((d) => d.difficulty === difficulty)
              ?.available ?? availability?.available ?? 0;
          const takeCount = Math.min(availForDiff, targetManual);
          actualDiffDist[difficulty] = takeCount;
          remainingToTake -= takeCount;
        } else {
          // Sort or distribute across available difficulties
          if (Array.isArray(availability?.details)) {
            for (const d of availability.details) {
              if (remainingToTake <= 0) break;
              const takeFromDiff = Math.min(d.available, remainingToTake);
              actualDiffDist[d.difficulty] = takeFromDiff;
              remainingToTake -= takeFromDiff;
            }
          } else {
            const availCount = availability?.available ?? targetManual;
            const takeFromDiff = Math.min(availCount, remainingToTake);
            actualDiffDist["MEDIUM"] = takeFromDiff;
            remainingToTake -= takeFromDiff;
          }
        }

        const actualCount = targetManual - remainingToTake;

        if (actualCount > 0) {
          const actualReq: AssemblyProviderRequest = {
            ...request,
            count: actualCount,
            difficultyDistribution: actualDiffDist,
          };

          const response =
            await this.rotationService.retrieveAndReserve(actualReq);
          const mapped = response.questions.map((q) =>
            this.mapToGeneratedQuestion(q, q.difficulty || difficulty),
          );
          assembledResults.push(...mapped);
        }
      } catch (err) {
        this.logger.warn(
          `Manual question retrieval notice (${err}). Shifting to templates.`,
        );
      }
    }

    // 5. Fetch Template Questions according to remaining target
    let remainingNeeded = limit - assembledResults.length;
    if (remainingNeeded > 0) {
      try {
        const templateQs = await this.fetchFromLegacyPool(
          { ...resolvedFilters, limit: remainingNeeded },
          [...excludeIds, ...assembledResults.map((q) => q.id)],
          topicId,
        );
        assembledResults.push(...templateQs);
      } catch (err) {
        this.logger.warn(`Template pool fetch notice (${err}).`);
      }
    }

    // 6. Final Failsafe: If still short, fill remaining quota from active manual questions in DB
    const finalNeeded = limit - assembledResults.length;
    if (finalNeeded > 0) {
      try {
        const existingIds = new Set([
          ...excludeIds,
          ...assembledResults.map((q) => q.id),
        ]);
        const extraManualQs = await this.prisma.question.findMany({
          where: {
            status: "ACTIVE",
            OR: [
              { topicId: topicId },
              { topicId: resolvedCode },
              { concept: { topicId: topicId } },
              { concept: { code: resolvedCode.toUpperCase() } },
            ],
            id: { notIn: Array.from(existingIds) },
          },
          take: finalNeeded,
        });

        const mappedExtra = extraManualQs.map((q) =>
          this.mapToGeneratedQuestion(
            q as any,
            (q as any).difficulty || difficulty,
          ),
        );
        assembledResults.push(...mappedExtra);
      } catch (err) {
        this.logger.warn(`Final manual pool fetch notice (${err}).`);
      }
    }

    this.logger.log(`    [QUESTION-SOURCE ⏱️] fetchQuestions("${inputConceptKey}", limit: ${limit}) returned ${assembledResults.length} questions in ${Date.now() - tStart}ms`);
    return assembledResults;
  }

  /**
   * Fallback: query the legacy GeneratedQuestion table.
   */
  private async fetchFromLegacyPool(
    filters: QuestionFilters,
    excludeIds: string[],
    topicId: string,
  ): Promise<GeneratedQuestion[]> {
    const questions = await this.legacyPool.fetchQuestions({
      ...filters,
      conceptKey: filters.conceptKey,
      excludeIds,
    });

    return this.normalizeLegacyConceptKeys(questions, topicId);
  }

  private async normalizeLegacyConceptKeys(
    questions: GeneratedQuestion[],
    topicId: string,
  ): Promise<GeneratedQuestion[]> {
    return questions.map((question) => ({
      ...question,
      conceptKey: topicId,
    }));
  }

  /**
   * Maps an AssemblyProviderQuestion (from QuestionRotationService) to the
   * GeneratedQuestion shape expected by QuestionAllocatorService downstream.
   *
   * Only fields actively used downstream are mapped. All other fields use safe defaults.
   */
  private mapToGeneratedQuestion(
    q: {
      id: string;
      questionText: string;
      answer: string;
      explanation: string;
      difficulty: "EASY" | "MEDIUM" | "HARD";
      topicId: string;
      sectionId: string;
      mcqData?: any;
      codingData?: any;
      options?: any;
      questionStatement?: string | null;
      instructions?: string | null;
    },
    difficulty: string,
  ): GeneratedQuestion {
    const isCoding =
      (q as any).questionType === "CODING" ||
      Boolean(q.codingData) ||
      (q.questionText || "").startsWith("### Problem Statement");
    const questionType = isCoding
      ? "CODING"
      : (q as any).questionType || "MULTIPLE_CHOICE";
    const rawOptions = isCoding ? [] : (q.mcqData?.options || q.options || []);
    return {
      id: q.id,
      // conceptKey maps from topicId — this is the bridge between the two schemas
      conceptKey: q.topicId,
      difficultyLevel: (q.difficulty ??
        difficulty) as GeneratedQuestion["difficultyLevel"],
      questionType: questionType as any,
      questionText: q.questionText,
      // questionHash is not on Question model — use id as stable unique identifier
      questionHash: q.id,
      // Encode full question data in metadata for downstream access
      metadata: {
        answer: q.answer,
        explanation: q.explanation,
        sectionId: q.sectionId,
        source: "QUESTION_BANK",
      } as unknown as GeneratedQuestion["metadata"],
      // Legacy required fields — safe defaults
      templateId: null as unknown as string,
      options: rawOptions as unknown as GeneratedQuestion["options"],
      mcqData: q.mcqData,
      codingData: q.codingData,

      correctAnswer: q.answer as unknown as GeneratedQuestion["correctAnswer"],
      solution: q.explanation as unknown as GeneratedQuestion["solution"],
      expectedAnswer: null as unknown as string,
      questionStatement: q.questionStatement as unknown as string,
      instructions: q.instructions as unknown as string,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as GeneratedQuestion;
  }
}
