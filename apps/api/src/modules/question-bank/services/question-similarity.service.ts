import { Injectable } from "@nestjs/common";
import { QuestionRepository } from "../repositories/question.repository";

export interface SimilarityResult {
  duplicate: boolean;
  similarity: number;
  matchedQuestionId: string | null;
}

@Injectable()
export class QuestionSimilarityService {
  constructor(private readonly questionRepo: QuestionRepository) {}

  /**
   * Tokenizes and normalizes text for Jaccard semantic similarity comparison.
   */
  private getTokens(text: string): Set<string> {
    const normalized = text
      .toLowerCase()
      .replace(/[0-9]+/g, "#") // Treat numbers as wildcards to detect structural duplicates
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ""); // Strip punctuation
    return new Set(normalized.split(/\s+/).filter((word) => word.length > 2));
  }

  /**
   * Calculates Jaccard similarity coefficient between two strings (value 0.0 to 1.0).
   */
  public calculateSemanticSimilarity(textA: string, textB: string): number {
    const tokensA = this.getTokens(textA);
    const tokensB = this.getTokens(textB);
    if (tokensA.size === 0 && tokensB.size === 0) return 1.0;

    const intersection = new Set([...tokensA].filter((x) => tokensB.has(x)));
    const union = new Set([...tokensA, ...tokensB]);

    return intersection.size / union.size;
  }

  /**
   * Performs an exact match check followed by narrowed Jaccard semantic similarity check.
   */
  async checkDuplicate(
    questionText: string,
    topicId: string,
    sectionId: string,
    threshold = 0.85,
  ): Promise<SimilarityResult> {
    // 1. Exact match check (case-insensitive, trimmed)
    const normalizedText = questionText.trim().toLowerCase();

    // Narrow search space to same topicId and sectionId
    const candidates = await this.questionRepo.findQuestionsForSimilarity(topicId, sectionId);

    // Look for exact matches
    const exactMatch = candidates.find((c) => c.questionText.trim().toLowerCase() === normalizedText);
    if (exactMatch) {
      return {
        duplicate: true,
        similarity: 100,
        matchedQuestionId: exactMatch.id,
      };
    }

    // 2. Jaccard Semantic Match on narrowed space
    let highestSimilarity = 0;
    let matchedQuestionId: string | null = null;

    for (const candidate of candidates) {
      const similarity = this.calculateSemanticSimilarity(questionText, candidate.questionText);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        matchedQuestionId = candidate.id;
      }
    }

    const similarityPercentage = Math.round(highestSimilarity * 100);

    return {
      duplicate: highestSimilarity >= threshold,
      similarity: similarityPercentage,
      matchedQuestionId: highestSimilarity >= threshold ? matchedQuestionId : null,
    };
  }
}
