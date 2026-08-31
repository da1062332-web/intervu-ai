import { Injectable, Optional, Inject } from "@nestjs/common";
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

    const activeTemplateKeys = new Set(activeTemplates.map((t) => t.conceptKey));
    const activeQuestionConceptIds = new Set(
      activeQuestions.map((q) => q.conceptId).filter(Boolean),
    );
    const activeQuestionTopicIds = new Set(
      activeQuestions.map((q) => q.topicId).filter(Boolean),
    );

    for (const section of config.sections) {
      if (!section.sectionTopics || section.sectionTopics.length === 0) {
        errors.push(
          `DEPENDENCY_FAIL: Section "${section.name}" has no topics — section requires at least one active topic`,
        );
      } else {
        const activeTopics = section.sectionTopics.filter(
          (st) => st.topic?.status === "ACTIVE",
        );
        if (activeTopics.length === 0) {
          errors.push(
            `DEPENDENCY_FAIL: Section "${section.name}" has topics but none are ACTIVE`,
          );
        }

        // ─── Topic → Template ─────────────────────────────────────────────────
        for (const st of section.sectionTopics) {
          if (!st.topic) continue;

          const topicConcepts = st.topic.concepts || [];
          const hasTemplate = topicConcepts.some((c) =>
            activeTemplateKeys.has(c.code),
          );
          const hasQuestion =
            activeQuestionTopicIds.has(st.topic.id) ||
            (st.topic.code ? activeQuestionTopicIds.has(st.topic.code) : false) ||
            topicConcepts.some((c) => activeQuestionConceptIds.has(c.id));

          if (!hasTemplate && !hasQuestion) {
            warnings.push(
              `DEPENDENCY_WARN: No templates or manual questions found mapped to concepts of topic "${st.topic.name}" — question generation may fail`,
            );
          }
        }
      }
    }

    const valid = errors.length === 0;
    return { valid, errors, warnings };
  }
}
