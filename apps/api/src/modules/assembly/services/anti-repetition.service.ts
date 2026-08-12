import { Injectable, Inject } from "@nestjs/common";
import { DuplicateCheckResult } from "../types/duplicate-check-result";
import { AppLogger } from "@intervu-ai/shared-logger";
import {
  SEMANTIC_SIMILARITY_PROVIDER,
  SemanticSimilarityProvider,
} from "../providers/semantic-similarity.provider";
import { QuestionPoolRepository } from "../repositories/question-pool.repository";

export interface PoolQuestion {
  id: string;
  text?: string;
  questionText?: string;
  content?: string;
  questionHash?: string;
  conceptKey?: string;
  difficultyLevel?: string;
  questionType?: string;
}

@Injectable()
export class AntiRepetitionService {
  private readonly logger = new AppLogger({ name: "AntiRepetitionService" });

  constructor(
    @Inject(SEMANTIC_SIMILARITY_PROVIDER)
    private readonly semanticProvider: SemanticSimilarityProvider,
    private readonly poolRepository: QuestionPoolRepository,
  ) {}

  async checkDuplicate(
    candidateQuestion: PoolQuestion,
    historyQuestions: PoolQuestion[],
    activeQuestions: PoolQuestion[],
  ): Promise<DuplicateCheckResult> {
    const candidateQuestionId = candidateQuestion.id;
    // Level 1: Historical Exact Match
    if (historyQuestions.some((q) => q.id === candidateQuestionId)) {
      this.logger.debug(
        `Historical exact match found for ${candidateQuestionId}`,
      );
      return {
        isDuplicate: true,
        reason: "EXACT_MATCH",
        confidenceScore: 1.0,
      };
    }

    // Level 2: Active Assembly Exact Match
    if (activeQuestions.some((q) => q.id === candidateQuestionId)) {
      this.logger.debug(
        `Active assembly exact match found for ${candidateQuestionId}`,
      );
      return {
        isDuplicate: true,
        reason: "EXACT_MATCH",
        confidenceScore: 1.0,
      };
    }

    // Level 3: Semantic Similarity (MVP Lexical)
    // Note: The SemanticSimilarityProvider currently provides basic lexical similarity,
    // NOT true semantic duplicate detection. (Post-MVP enhancement)
    const getCandidateText = () =>
      candidateQuestion.text ||
      candidateQuestion.questionText ||
      candidateQuestion.content ||
      "";
    const candidateText = getCandidateText();

    if (candidateText) {
      for (const hq of [...historyQuestions, ...activeQuestions]) {
        const hqText = hq.text || hq.questionText || hq.content || "";
        if (!hqText) continue;

        const similarity = await this.semanticProvider.calculateSimilarity(
          candidateText,
          hqText,
        );
        if (similarity > 0.85) {
          this.logger.debug(
            `Semantic match found for ${candidateQuestionId} against ${hq.id} with score ${similarity}`,
          );
          return {
            isDuplicate: true,
            reason: "SEMANTIC_MATCH",
            confidenceScore: similarity,
          };
        }
      }
    }

    return {
      isDuplicate: false,
    };
  }

  async filterPool<T extends PoolQuestion>(
    pool: T[],
    historyIds: string[],
    activeIds: string[],
  ): Promise<T[]> {
    if (!pool || pool.length === 0) return [];

    // O(1) Set lookups for fast Level 1 & Level 2 exact match filtering
    const historySet = new Set(historyIds.filter((id) => Boolean(id)));
    const activeSet = new Set(activeIds.filter((id) => Boolean(id)));

    const candidatesForSemanticCheck: T[] = [];
    const validQuestions: T[] = [];

    for (const q of pool) {
      if (!q || !q.id) continue;
      if ((historySet.size > 0 && historySet.has(q.id)) || (activeSet.size > 0 && activeSet.has(q.id))) {
        // Instant Level 1/2 filter out without DB query or string comparison
        continue;
      }
      candidatesForSemanticCheck.push(q);
    }

    if (candidatesForSemanticCheck.length === 0) {
      return [];
    }

    // Only fetch full objects from DB if semantic check is needed for remaining questions
    const historyQuestions =
      historyIds.length > 0
        ? await this.poolRepository.getQuestionsByIds(historyIds)
        : [];
    const activeQuestions =
      activeIds.length > 0
        ? await this.poolRepository.getQuestionsByIds(activeIds)
        : [];

    for (const q of candidatesForSemanticCheck) {
      const check = await this.checkDuplicate(
        q,
        historyQuestions,
        activeQuestions,
      );
      if (!check.isDuplicate) {
        validQuestions.push(q);
      }
    }

    return validQuestions;
  }
}
