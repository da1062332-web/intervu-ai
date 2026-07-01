import { Injectable, Logger } from "@nestjs/common";
import { IQuestionSource, QuestionFilters } from "./question-source.interface";
import { QuestionRotationService } from "../../question-bank/services/question-rotation.service";
import { QuestionPoolRepository } from "../repositories/question-pool.repository";
import { GeneratedQuestion } from "@prisma/client";
import { AssemblyProviderRequest } from "@intervu-ai/contracts";

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
  ) {}

  async fetchQuestions(filters: QuestionFilters): Promise<GeneratedQuestion[]> {
    if (!this.useRealBank) {
      this.logger.warn(
        "Real question bank disabled. Using legacy GeneratedQuestion pool.",
      );
      return this.legacyPool.fetchQuestions(filters);
    }

    const topicId = filters.conceptKey ?? "";
    const difficulty = (filters.difficultyLevel ?? "MEDIUM") as
      | "EASY"
      | "MEDIUM"
      | "HARD";
    const limit = filters.limit ?? 10;
    const excludeIds = filters.excludeIds ?? [];

    // Build the AssemblyProviderRequest for QuestionRotationService
    // We use a dummy sectionId because the QuestionRotationService filters by sectionId,
    // but our IQuestionSource contract only exposes conceptKey (topicId).
    // We fetch by topicId filter only — sectionId filtering is handled at blueprint level.
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
        return this.fetchFromLegacyPool(filters, excludeIds);
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
      return this.fetchFromLegacyPool(filters, excludeIds);
    }
  }

  /**
   * Fallback: query the legacy GeneratedQuestion table.
   */
  private async fetchFromLegacyPool(
    filters: QuestionFilters,
    excludeIds: string[],
  ): Promise<GeneratedQuestion[]> {
    return this.legacyPool.fetchQuestions({ ...filters, excludeIds });
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
