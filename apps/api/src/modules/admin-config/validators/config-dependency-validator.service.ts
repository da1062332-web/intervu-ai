import { Injectable, Optional, Inject, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConfigurationValidationResult } from "./configuration-validator.service";
import { FullExamConfig } from "../types";

/**
 * Task Group 6 — Config Dependency Validator
 *
 * Validates cross-entity relationships (dependency graph) before publish.
 *
 * Rules:
 *  - Section → Topics:  every section must have ≥1 active topic
 *  - Topic → Template:  warns when no templates exist in system for topic's concepts
 *  - Distribution → Questions:  totalQuestions > 0 required
 *
 * PERF: Previously ran 2 DB queries per topic (N+1 pattern). Now batches all
 * concept codes and topic IDs into exactly 2 total DB queries and resolves
 * per-topic coverage using in-memory Set lookups.
 */
@Injectable()
export class ConfigDependencyValidatorService {
  constructor(
    @Optional() @Inject(PrismaService) private readonly prisma?: PrismaService,
  ) {}

  async validateDependencies(
    config: FullExamConfig | null,
  ): Promise<ConfigurationValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config) {
      return {
        valid: false,
        errors: [`Configuration not found`],
        warnings: [],
      };
    }

    // ─── Distribution → Questions ────────────────────────────────────────────
    if (!config.totalQuestions || config.totalQuestions === 0) {
      errors.push(
        "DEPENDENCY_FAIL: Question count is 0 — distribution cannot be applied",
      );
    }

    if (!config.difficultyDistribution) {
      errors.push(
        "DEPENDENCY_FAIL: No difficulty distribution set — cannot compute question breakdown",
      );
    }

    // ─── Section → Topics ────────────────────────────────────────────────────
    if (config.sections.length === 0) {
      errors.push("DEPENDENCY_FAIL: No sections defined");
    }

    // Pre-fetch active templates and questions in a single batch for all topics
    const allConceptCodes: string[] = [];
    const allConceptIds: string[] = [];
    const allTopicIdsAndCodes = new Set<string>();

    for (const section of config.sections || []) {
      for (const st of section.sectionTopics || []) {
        if (!st.topic) continue;
        allTopicIdsAndCodes.add(st.topic.id);
        if (st.topic.code) allTopicIdsAndCodes.add(st.topic.code);
        for (const c of st.topic.concepts || []) {
          if (c.code) allConceptCodes.push(c.code);
          if (c.id) allConceptIds.push(c.id);
        }
      }
    }

    const [activeTemplates, activeQuestions] = await Promise.all([
      this.prisma && allConceptCodes.length > 0
        ? this.prisma.template.findMany({
            where: {
              isActive: true,
              deletedAt: null,
              conceptKey: { in: Array.from(new Set(allConceptCodes)) },
            },
            select: { conceptKey: true },
          })
        : Promise.resolve([]),
      this.prisma && (allConceptIds.length > 0 || allTopicIdsAndCodes.size > 0)
        ? this.prisma.question.findMany({
            where: {
              status: "ACTIVE",
              OR: [
                ...(allConceptIds.length > 0
                  ? [{ conceptId: { in: Array.from(new Set(allConceptIds)) } }]
                  : []),
                ...(allTopicIdsAndCodes.size > 0
                  ? [{ topicId: { in: Array.from(allTopicIdsAndCodes) } }]
                  : []),
              ],
            },
            select: { conceptId: true, topicId: true },
          })
        : Promise.resolve([]),
    ]);

    const activeTemplateKeys = new Set(
      activeTemplates.map((t) => t.conceptKey),
    );
    const activeQuestionConceptIds = new Set(
      activeQuestions.map((q) => q.conceptId).filter(Boolean),
    );
    const activeQuestionTopicIds = new Set(
      activeQuestions.map((q) => q.topicId).filter(Boolean),
    );

    // Pre-fetch active templates and questions in a single batch for all topics
    const allConceptCodes: string[] = [];
    const allConceptIds: string[] = [];
    const allTopicIdsAndCodes = new Set<string>();

    for (const section of config.sections || []) {
      for (const st of section.sectionTopics || []) {
        if (!st.topic) continue;
        allTopicIdsAndCodes.add(st.topic.id);
        if (st.topic.code) allTopicIdsAndCodes.add(st.topic.code);
        for (const c of st.topic.concepts || []) {
          if (c.code) allConceptCodes.push(c.code);
          if (c.id) allConceptIds.push(c.id);
        }
      }
    }

    const [activeTemplates, activeQuestions] = await Promise.all([
      this.prisma && allConceptCodes.length > 0
        ? this.prisma.template.findMany({
            where: {
              isActive: true,
              deletedAt: null,
              conceptKey: { in: Array.from(new Set(allConceptCodes)) },
            },
            select: { conceptKey: true },
          })
        : Promise.resolve([]),
      this.prisma && (allConceptIds.length > 0 || allTopicIdsAndCodes.size > 0)
        ? this.prisma.question.findMany({
            where: {
              status: "ACTIVE",
              OR: [
                ...(allConceptIds.length > 0
                  ? [{ conceptId: { in: Array.from(new Set(allConceptIds)) } }]
                  : []),
                ...(allTopicIdsAndCodes.size > 0
                  ? [{ topicId: { in: Array.from(allTopicIdsAndCodes) } }]
                  : []),
              ],
            },
            select: { conceptId: true, topicId: true },
          })
        : Promise.resolve([]),
    ]);

    const activeTemplateKeys = new Set(
      activeTemplates.map((t) => t.conceptKey),
    );
    const activeQuestionConceptIds = new Set(
      activeQuestions.map((q) => q.conceptId).filter(Boolean),
    );
    const activeQuestionTopicIds = new Set(
      activeQuestions.map((q) => q.topicId).filter(Boolean),
    );

    // ── Collect all concept codes / concept IDs / topic IDs across ALL sections
    // so we can fire exactly 2 batch DB queries instead of N*2 sequential ones.
    const allConceptCodes: string[] = [];
    const allConceptIds: string[] = [];
    const allTopicIds: string[] = [];

    for (const section of config.sections) {
      if (!section.sectionTopics) continue;
      for (const st of section.sectionTopics) {
        if (!st.topic) continue;
        const topicConcepts = st.topic.concepts || [];
        for (const c of topicConcepts) {
          allConceptCodes.push(c.code);
          allConceptIds.push(c.id);
        }
        allTopicIds.push(st.topic.id);
        if (st.topic.code) allTopicIds.push(st.topic.code);
      }
    }

    const tBatch = Date.now();

    // ── Batch Query 1: Which concept codes have at least 1 active template? ──
    const uniqueConceptCodes = [...new Set(allConceptCodes)];
    const activeTemplates =
      uniqueConceptCodes.length > 0
        ? await this.prisma.template.findMany({
            where: {
              isActive: true,
              deletedAt: null,
              conceptKey: { in: uniqueConceptCodes },
            },
            select: { conceptKey: true },
          })
        : [];
    const templateConceptSet = new Set(
      activeTemplates.map((t) => t.conceptKey),
    );

    // ── Batch Query 2: Which topic IDs / concept IDs have active questions? ──
    const uniqueTopicIds = [...new Set(allTopicIds)];
    const uniqueConceptIds = [...new Set(allConceptIds)];
    const orClauses: any[] = [];
    if (uniqueConceptIds.length > 0)
      orClauses.push({ conceptId: { in: uniqueConceptIds } });
    if (uniqueTopicIds.length > 0)
      orClauses.push({ topicId: { in: uniqueTopicIds } });

    const activeQuestions =
      orClauses.length > 0
        ? await this.prisma.question.findMany({
            where: { status: "ACTIVE", OR: orClauses },
            select: { topicId: true, conceptId: true },
          })
        : [];
    const questionTopicSet = new Set(
      activeQuestions.map((q) => q.topicId).filter(Boolean),
    );
    const questionConceptSet = new Set(
      activeQuestions.map((q) => q.conceptId).filter(Boolean),
    );

    this.logger.log(
      `[DEP-VALIDATOR ⏱️] Batch DB check in ${Date.now() - tBatch}ms — ` +
        `${templateConceptSet.size} concept codes covered by templates, ` +
        `${questionTopicSet.size} topic IDs covered by questions`,
    );

    // ── Per-section/topic validation using in-memory Set lookups (no DB) ─────
    for (const section of config.sections) {
      if (!section.sectionTopics || section.sectionTopics.length === 0) {
        errors.push(
          `DEPENDENCY_FAIL: Section "${section.name}" has no topics — section requires at least one active topic`,
        );
        continue;
      }

      const activeTopics = section.sectionTopics.filter(
        (st) => st.topic?.status === "ACTIVE",
      );
      if (activeTopics.length === 0) {
        errors.push(
          `DEPENDENCY_FAIL: Section "${section.name}" has topics but none are ACTIVE`,
        );
      }

      for (const st of section.sectionTopics) {
        if (!st.topic) continue;

        const topicConcepts = st.topic.concepts || [];
        const conceptCodes = topicConcepts.map((c) => c.code);
        const conceptIds = topicConcepts.map((c) => c.id);

        const hasTemplate = conceptCodes.some((code) =>
          templateConceptSet.has(code),
        );
        const hasQuestion =
          questionTopicSet.has(st.topic.id) ||
          questionTopicSet.has(st.topic.code) ||
          conceptIds.some((id) => questionConceptSet.has(id));

        if (!hasTemplate && !hasQuestion) {
          warnings.push(
            `DEPENDENCY_WARN: No templates or manual questions found mapped to concepts of topic "${st.topic.name}" — question generation may fail`,
          );
        }
      }
    }

    const valid = errors.length === 0;
    return { valid, errors, warnings };
  }
}
