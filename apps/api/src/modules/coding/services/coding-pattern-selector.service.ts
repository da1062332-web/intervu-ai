import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CodingPatternRepository } from "../repositories/coding-pattern.repository";
import { CodingOracleService } from "./coding-oracle.service";
import { OracleRegistry } from "../oracles/oracle.registry";
import { CodingPattern, CodingPatternStatus, DifficultyLevel } from "@prisma/client";

export interface PatternSelectionCriteria {
  topicId?: string;
  conceptKey?: string;
  difficulty?: DifficultyLevel | string;
  recentlyUsedPatternIds?: string[];
  allowDraft?: boolean;
}

@Injectable()
export class CodingPatternSelectorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patternRepo: CodingPatternRepository,
    private readonly oracleService: CodingOracleService,
    private readonly oracleRegistry: OracleRegistry,
  ) {}

  /**
   * Selects an eligible active CodingPattern resolving:
   * Blueprint -> Coding Section -> Topic -> Concept -> Coding Pattern -> Oracle check
   */
  async selectPattern(criteria: PatternSelectionCriteria): Promise<CodingPattern> {
    let difficultyEnum: DifficultyLevel | undefined = undefined;
    if (criteria.difficulty) {
      const upperDiff = String(criteria.difficulty).toUpperCase();
      if (upperDiff === "EASY" || upperDiff === "MEDIUM" || upperDiff === "HARD") {
        difficultyEnum = upperDiff as DifficultyLevel;
      }
    }

    // 1. Resolve Topic -> Concept keys from DB if topicId provided
    const targetConceptKeys = new Set<string>();
    if (criteria.conceptKey) {
      targetConceptKeys.add(criteria.conceptKey.toLowerCase());
    }

    if (criteria.topicId) {
      try {
        const concepts = await this.prisma.concept.findMany({
          where: { topicId: criteria.topicId },
          select: { code: true, name: true },
        });
        for (const c of concepts) {
          if (c.code) targetConceptKeys.add(c.code.toLowerCase());
          if (c.name) targetConceptKeys.add(c.name.toLowerCase());
        }
      } catch {
        // Fall back gracefully if topic search encounters non-relational context
      }
    }

    // 2. Fetch all candidate patterns matching difficulty and active status
    const { items: allPatterns } = await this.patternRepo.findAll({
      status: criteria.allowDraft ? undefined : CodingPatternStatus.PUBLISHED,
      difficulty: difficultyEnum,
      take: 100,
    });

    let candidates = allPatterns.filter((p) => p.deletedAt === null);

    // Fall back to all non-deleted if published pool is empty
    if (candidates.length === 0) {
      const { items: fallbackPatterns } = await this.patternRepo.findAll({
        difficulty: difficultyEnum,
        take: 100,
      });
      candidates = fallbackPatterns.filter((p) => p.deletedAt === null);
    }

    if (candidates.length === 0) {
      throw new NotFoundException(
        `No coding patterns found matching difficulty "${criteria.difficulty || "ANY"}"`,
      );
    }

    // 3. Filter candidates matching resolved Topic / Concept keys
    if (targetConceptKeys.size > 0) {
      const conceptMatches = candidates.filter((p) => {
        const pSlug = p.slug.toLowerCase();
        const pTitle = p.title.toLowerCase();
        const pConcept = String((p.metadata as any)?.conceptKey || "").toLowerCase();
        const pTopic = String((p.metadata as any)?.topicId || "").toLowerCase();

        for (const key of targetConceptKeys) {
          if (
            pSlug.includes(key) ||
            pTitle.includes(key) ||
            pConcept === key ||
            pTopic === key
          ) {
            return true;
          }
        }
        return false;
      });

      if (conceptMatches.length > 0) {
        candidates = conceptMatches;
      }
    }

    // 4. Anti-repetition filter (exclude recently used pattern IDs or keys)
    const recentlyUsed = new Set(criteria.recentlyUsedPatternIds || []);
    const unrepeatedCandidates = candidates.filter(
      (p) => !recentlyUsed.has(p.id) && !recentlyUsed.has(p.patternKey),
    );

    const eligiblePool = unrepeatedCandidates.length > 0 ? unrepeatedCandidates : candidates;

    // 5. Oracle Availability Check (active status in DB + registered executable in OracleRegistry)
    const validPatterns: CodingPattern[] = [];
    for (const pattern of eligiblePool) {
      try {
        if (this.oracleRegistry.hasOracle(pattern.oracleKey)) {
          await this.oracleService.validateOracleForUsage(pattern.oracleKey);
          validPatterns.push(pattern);
        }
      } catch {
        continue;
      }
    }

    if (validPatterns.length === 0) {
      throw new NotFoundException(
        `No eligible coding patterns available with active, registered Oracles for difficulty "${criteria.difficulty || "ANY"}"`,
      );
    }

    // Uniformly pick from valid pool
    const selected = validPatterns[Math.floor(Math.random() * validPatterns.length)];
    return selected;
  }
}
