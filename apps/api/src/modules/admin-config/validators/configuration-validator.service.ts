import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { FullExamConfig } from "../types";

export interface ConfigurationValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Task Group 1 — Configuration Validation Engine
 *
 * Performs multi-layer validation of a complete exam configuration.
 * Layers: Exam → Section → Topic → Difficulty → Template
 */
@Injectable()
export class ConfigurationValidatorService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(
    config: FullExamConfig | null,
  ): Promise<ConfigurationValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // ─── Exam Layer ──────────────────────────────────────────────────────────
    if (!config) {
      errors.push(`Exam configuration not found`);
      return { valid: false, errors, warnings };
    }

    if (!config.name || config.name.trim().length === 0) {
      errors.push("Exam name must not be empty");
    }

    if (!config.durationMinutes || config.durationMinutes <= 0) {
      errors.push("Exam duration must be greater than 0 minutes");
    }

    if (!config.totalQuestions || config.totalQuestions <= 0) {
      errors.push("Total questions must be greater than 0");
    }

    if (config.isArchived || config.status === "ARCHIVED") {
      errors.push("Archived configurations cannot be published");
    }

    // ─── Section Layer ───────────────────────────────────────────────────────
    if (!config.sections || config.sections.length === 0) {
      errors.push("At least one section must be configured");
    } else {
      for (const section of config.sections) {
        if (!section.questionCount || section.questionCount <= 0) {
          errors.push(
            `Section "${section.name}" must have a question count greater than 0`,
          );
        }

        if (
          !section.sectionDurationMinutes ||
          section.sectionDurationMinutes <= 0
        ) {
          errors.push(
            `Section "${section.name}" must have a duration greater than 0 minutes`,
          );
        }

        // ─── Topic Layer ─────────────────────────────────────────────────────
        if (!section.sectionTopics || section.sectionTopics.length === 0) {
          errors.push(
            `Section "${section.name}" must have at least one topic mapped`,
          );
        } else {
          for (const st of section.sectionTopics) {
            if (!st.topic) {
              errors.push(
                `Section "${section.name}" references a non-existent topic`,
              );
            } else if (st.topic.status !== "ACTIVE") {
              errors.push(
                `Section "${section.name}": topic "${st.topic.name}" is not active`,
              );
            }
          }
        }
      }

      // Validate that sum of section question counts matches totalQuestions
      const sectionTotal = config.sections.reduce(
        (sum, s) => sum + (s.questionCount || 0),
        0,
      );
      if (sectionTotal !== config.totalQuestions) {
        warnings.push(
          `Sum of section question counts (${sectionTotal}) does not match exam total questions (${config.totalQuestions})`,
        );
      }
    }

    // ─── Difficulty Layer ────────────────────────────────────────────────────
    if (!config.difficultyDistribution) {
      errors.push(
        "Difficulty distribution must be configured before publishing",
      );
    } else {
      const { easyPercentage, mediumPercentage, hardPercentage } =
        config.difficultyDistribution;
      const total = easyPercentage + mediumPercentage + hardPercentage;
      if (total !== 100) {
        errors.push(
          `Difficulty distribution must total 100% (currently ${total}%: Easy ${easyPercentage}% + Medium ${mediumPercentage}% + Hard ${hardPercentage}%)`,
        );
      }
    }

    // ─── Template Layer (advisory) ───────────────────────────────────────────
    const templateCount = await this.prisma.template.count({
      where: { isActive: true, deletedAt: null },
    });
    if (templateCount === 0) {
      warnings.push(
        "No active templates found in the system. Question generation may fail.",
      );
    }

    const valid = errors.length === 0;
    return { valid, errors, warnings };
  }
}
