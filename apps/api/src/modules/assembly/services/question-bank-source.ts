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
    const inputConceptKey = filters.conceptKey || "";

    // 1. Resolve UUID to Code if necessary
    let resolvedCode = inputConceptKey;
    const topic = await this.prisma.topic.findUnique({
      where: { id: inputConceptKey },
    });
    if (topic) {
      resolvedCode = topic.code;
    }

    const concept = await this.prisma.concept.findFirst({
      where: { code: resolvedCode.toUpperCase() },
    });

    const resolvedFilters = { ...filters, conceptKey: resolvedCode };

    const isManual = concept?.questionSources?.includes("MANUAL");

    if (isManual) {
      const difficulty = (filters.difficultyLevel ?? "MEDIUM") as
        | "EASY"
        | "MEDIUM"
        | "HARD";
      const limit = filters.limit ?? 10;
      const excludeIds = filters.excludeIds ?? [];

      const diffCount = limit;
      const topicId = concept?.topicId || "";

      const request: AssemblyProviderRequest = {
        examId: filters.examId || "assembly-source",
        sectionId: topicId, // using topicId as sectionId approximation
        count: diffCount,
        difficultyDistribution: {
          EASY: difficulty === "EASY" ? diffCount : 0,
          MEDIUM: difficulty === "MEDIUM" ? diffCount : 0,
          HARD: difficulty === "HARD" ? diffCount : 0,
        },
        topicIds: topicId ? [topicId] : undefined,
      };

      // Check availability first. If pool is insufficient, throw exception (do NOT fall back!)
      const availability = await this.rotationService.checkAvailability(request);
      if (
        availability.status === "INSUFFICIENT_POOL" ||
        availability.available < limit
      ) {
        throw new BadRequestException({
          message: `Insufficient manual question pool for concept ${resolvedCode} at difficulty ${difficulty}. Required: ${limit}, Available: ${availability.available}.`,
          details: availability.details,
        });
      }

      // Reserve and retrieve questions from the real bank
      const response = await this.rotationService.retrieveAndReserve(request);
      return response.questions.map((q) =>
        this.mapToGeneratedQuestion(q, difficulty),
      );
    }

    // Default: VARIABLE_TEMPLATE (using legacy templates / GeneratedQuestion pool)
    if (!this.useRealBank) {
      this.logger.warn(
        "Real question bank disabled. Using legacy GeneratedQuestion pool.",
      );
      return this.legacyPool.fetchQuestions(resolvedFilters);
    }

    const topicId = topic?.id || resolvedCode;
    const difficulty = (filters.difficultyLevel ?? "MEDIUM") as
      | "EASY"
      | "MEDIUM"
      | "HARD";
    const limit = filters.limit ?? 10;
    const excludeIds = filters.excludeIds ?? [];

    const diffCount = limit;
    const request: AssemblyProviderRequest = {
      examId: "assembly-source",
      sectionId: topicId, // Using topicId as sectionId approximation for topic-based filtering
      count: diffCount,
      difficultyDistribution: {
        EASY: difficulty === "EASY" ? diffCount : 0,
        MEDIUM: difficulty === "MEDIUM" ? diffCount : 0,
        HARD: difficulty === "HARD" ? diffCount : 0,
      },
      topicIds: topicId ? [topicId] : undefined,
    };

    try {
      // Check availability first without consuming reservations
      const availability =
        await this.rotationService.checkAvailability(request);

      if (
        availability.status === "INSUFFICIENT_POOL" ||
        availability.available === 0
      ) {
        this.logger.warn(
          `Question bank insufficient for topic=${topicId} difficulty=${difficulty} ` +
            `(required=${limit}, available=${availability.available}). ` +
            `Falling back to legacy GeneratedQuestion pool.`,
        );
        return this.fetchFromLegacyPool(resolvedFilters, excludeIds, topicId);
      }

      // Retrieve and reserve questions from the real bank
      const response = await this.rotationService.retrieveAndReserve(request);

      this.logger.debug(
        `QuestionBankSource: fetched ${response.questions.length} questions ` +
          `for topic=${topicId} difficulty=${difficulty} (assembly=${response.assemblyId})`,
      );

      // Map Question → GeneratedQuestion-shaped object
      // Only the fields consumed downstream by QuestionAllocatorService are mapped:
      //   id, conceptKey, difficultyLevel, questionType, questionText, questionHash, metadata
      return response.questions.map((q) =>
        this.mapToGeneratedQuestion(q, difficulty),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `QuestionBankSource real-bank retrieval failed (${message}). ` +
          `Falling back to legacy pool.`,
      );
      return this.fetchFromLegacyPool(resolvedFilters, excludeIds, topicId);
    }
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
    },
    difficulty: string,
  ): GeneratedQuestion {
    return {
      id: q.id,
      // conceptKey maps from topicId — this is the bridge between the two schemas
      conceptKey: q.topicId,
      difficultyLevel: (q.difficulty ??
        difficulty) as GeneratedQuestion["difficultyLevel"],
      questionType: "MULTIPLE_CHOICE",
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
      options: [] as unknown as GeneratedQuestion["options"],
      correctAnswer: q.answer as unknown as GeneratedQuestion["correctAnswer"],
      solution: q.explanation as unknown as GeneratedQuestion["solution"],
      expectedAnswer: null as unknown as string,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as GeneratedQuestion;
  }
}
