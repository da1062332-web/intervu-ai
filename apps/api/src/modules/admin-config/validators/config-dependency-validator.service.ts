import { Injectable } from "@nestjs/common";
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
  constructor(private readonly prisma: PrismaService) {}

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
          const conceptCodes = topicConcepts.map((c) => c.code);

          // Check if templates exist specifically for this topic's concepts
          const templateCount = await this.prisma.template.count({
            where: {
              isActive: true,
              deletedAt: null,
              conceptKey: { in: conceptCodes },
            },
          });

          if (templateCount === 0) {
            warnings.push(
              `DEPENDENCY_WARN: No templates found mapped to concepts of topic "${st.topic.name}" — question generation may fail`,
            );
            // We do not break here because we want to warn for each topic
          }
        }
      }
    }

    const valid = errors.length === 0;
    return { valid, errors, warnings };
  }
}
