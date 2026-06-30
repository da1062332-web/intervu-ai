import { Injectable, Logger } from "@nestjs/common";
import { AllocatedSectionDto } from "@intervu/shared";

/** A pair of duplicate questions found in the assembly */
export interface DuplicatePair {
  questionIdA: string;
  questionIdB: string;
  reason: "EXACT_ID_MATCH" | "EXACT_HASH_MATCH";
  sectionKeyA: string;
  sectionKeyB: string;
}

/** Detailed duplicate detection report for one section */
export interface SectionDuplicateReport {
  sectionKey: string;
  duplicates: DuplicatePair[];
  duplicateCount: number;
}

/** Full assembly-level duplicate detection report */
export interface DuplicateDetectionReport {
  /** Duplicate pairs found spanning multiple sections */
  crossSectionDuplicates: DuplicatePair[];
  /** Per-section duplicate report */
  sectionReports: SectionDuplicateReport[];
  /** Total count across all levels */
  totalDuplicateCount: number;
  /** All unique duplicate question IDs */
  duplicateQuestionIds: string[];
}

/**
 * DuplicateDetectionService — post-assembly duplicate analysis.
 *
 * Detects duplicates at two levels:
 * 1. Cross-section: same questionId appears in more than one section
 * 2. Within-section: same questionId appears twice in one section
 *
 * Detection strategy:
 * - Level 1 (primary): Exact questionId match (O(n) using Set)
 * - Level 2 (secondary): Exact questionHash match (O(n) using Map)
 *
 * ARCHITECTURAL NOTE: Why this does not reuse AntiRepetitionService:
 * 1. AntiRepetitionService is ASYNCHRONOUS (calls SemanticSimilarityProvider LLMs) and runs Pre-Allocation.
 * 2. If used for post-assembly validation, it would require O(N²) asynchronous calls, breaking our <5s SLA.
 * 3. DuplicateDetectionService is strictly SYNCHRONOUS and structural (exact matches only) running in O(N).
 * Therefore, separation of concerns is intentionally maintained to preserve performance.
 *
 * Reuse: Used internally by AssemblyValidationV2Service.
 * Also available for direct invocation via GET /assembly/:id/health.
 */
@Injectable()
export class DuplicateDetectionService {
  private readonly logger = new Logger(DuplicateDetectionService.name);

  /**
   * Analyses an array of assembled sections for duplicate questions.
   *
   * @param sections - The allocated sections from an assembly
   * @returns DuplicateDetectionReport with full duplicate details
   */
  detectDuplicates(sections: AllocatedSectionDto[]): DuplicateDetectionReport {
    const crossSectionDuplicates: DuplicatePair[] = [];
    const sectionReports: SectionDuplicateReport[] = [];

    // Map of questionId → first-seen sectionKey (for cross-section detection)
    const globalIdMap = new Map<string, string>();
    // Map of questionHash → { id, sectionKey } (for hash-based detection)
    const globalHashMap = new Map<string, { id: string; sectionKey: string }>();

    const allDuplicateIds = new Set<string>();

    for (const section of sections) {
      const withinSectionDuplicates: DuplicatePair[] = [];
      // Per-section tracking
      const sectionIdSet = new Set<string>();

      for (const question of section.questions) {
        const { questionId, questionHash } = question;

        // Level 1: Cross-section exact ID match
        if (globalIdMap.has(questionId)) {
          const firstSectionKey = globalIdMap.get(questionId)!;
          if (firstSectionKey !== section.sectionKey) {
            crossSectionDuplicates.push({
              questionIdA: questionId,
              questionIdB: questionId,
              reason: "EXACT_ID_MATCH",
              sectionKeyA: firstSectionKey,
              sectionKeyB: section.sectionKey,
            });
            allDuplicateIds.add(questionId);
            this.logger.warn(
              `Cross-section duplicate: ${questionId} in sections ${firstSectionKey} and ${section.sectionKey}`,
            );
          } else if (sectionIdSet.has(questionId)) {
            // Within-section exact ID match
            withinSectionDuplicates.push({
              questionIdA: questionId,
              questionIdB: questionId,
              reason: "EXACT_ID_MATCH",
              sectionKeyA: section.sectionKey,
              sectionKeyB: section.sectionKey,
            });
            allDuplicateIds.add(questionId);
          }
        } else {
          globalIdMap.set(questionId, section.sectionKey);
        }
        sectionIdSet.add(questionId);

        // Level 2: Hash-based detection (catches same content with different IDs)
        if (questionHash && questionHash !== questionId) {
          if (globalHashMap.has(questionHash)) {
            const existing = globalHashMap.get(questionHash)!;
            if (existing.id !== questionId) {
              const pair: DuplicatePair = {
                questionIdA: existing.id,
                questionIdB: questionId,
                reason: "EXACT_HASH_MATCH",
                sectionKeyA: existing.sectionKey,
                sectionKeyB: section.sectionKey,
              };
              if (existing.sectionKey === section.sectionKey) {
                withinSectionDuplicates.push(pair);
              } else {
                crossSectionDuplicates.push(pair);
              }
              allDuplicateIds.add(questionId);
              allDuplicateIds.add(existing.id);
            }
          } else {
            globalHashMap.set(questionHash, {
              id: questionId,
              sectionKey: section.sectionKey,
            });
          }
        }
      }

      sectionReports.push({
        sectionKey: section.sectionKey,
        duplicates: withinSectionDuplicates,
        duplicateCount: withinSectionDuplicates.length,
      });
    }

    const totalDuplicateCount =
      crossSectionDuplicates.length +
      sectionReports.reduce((acc, r) => acc + r.duplicateCount, 0);

    this.logger.debug(
      `Duplicate detection complete: ${totalDuplicateCount} duplicates found ` +
        `(${crossSectionDuplicates.length} cross-section, ` +
        `${sectionReports.reduce((a, r) => a + r.duplicateCount, 0)} within-section)`,
    );

    return {
      crossSectionDuplicates,
      sectionReports,
      totalDuplicateCount,
      duplicateQuestionIds: Array.from(allDuplicateIds),
    };
  }
}
