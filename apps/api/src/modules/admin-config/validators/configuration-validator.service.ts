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
 * Layers: Exam → Section → Topic → Concept → Template → Difficulty
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

    // Collect all active concepts and topics across all sections for high-performance batch verification
    const allActiveConcepts: Array<{
      id: string;
      code: string;
      name: string;
      topicId: string;
      topicCode?: string;
      topicName: string;
    }> = [];
    const allTopicIdsAndCodes = new Set<string>();

    for (const section of config.sections || []) {
      for (const st of section.sectionTopics || []) {
        if (!st.topic) continue;
        allTopicIdsAndCodes.add(st.topic.id);
        if (st.topic.code) allTopicIdsAndCodes.add(st.topic.code);
        for (const concept of st.topic.concepts || []) {
          if (concept.status === "ACTIVE") {
            allActiveConcepts.push({
              id: concept.id,
              code: concept.code,
              name: concept.name,
              topicId: st.topic.id,
              topicCode: st.topic.code,
              topicName: st.topic.name,
            });
          }
        }
      }
    }

    const conceptCodes = Array.from(
      new Set(allActiveConcepts.map((c) => c.code).filter(Boolean)),
    );
    const conceptIds = Array.from(
      new Set(allActiveConcepts.map((c) => c.id).filter(Boolean)),
    );

    const [activeTemplates, activeQuestions] = await Promise.all([
      conceptCodes.length > 0
        ? this.prisma.template.findMany({
            where: {
              conceptKey: { in: conceptCodes },
              isActive: true,
              deletedAt: null,
            },
            select: { conceptKey: true },
          })
        : Promise.resolve([]),
      conceptIds.length > 0 || allTopicIdsAndCodes.size > 0
        ? this.prisma.question.findMany({
            where: {
              status: "ACTIVE",
              OR: [
                ...(conceptIds.length > 0 ? [{ conceptId: { in: conceptIds } }] : []),
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
            if (!st.topic) {
              continue; // Skip further validation if topic is undefined
            }

            if (!st.topicWeightage) {
              errors.push(
                `Topic "${st.topic.name}" is missing a weightage assignment in section "${section.name}"`,
              );
            }

            // Validate Concepts mapping
            const activeConcepts =
              st.topic.concepts?.filter((c) => c.status === "ACTIVE") || [];
            if (activeConcepts.length === 0) {
              errors.push(
                `Topic "${st.topic.name}" has no active concepts assigned in section "${section.name}"`,
              );
            } else {
              // Validate Templates mapping in-memory from pre-fetched batch
              for (const concept of st.topic.concepts) {
                if (concept.status !== "ACTIVE") {
                  continue; // Skip disabled/inactive concepts
                }

                const hasTemplate = activeTemplateKeys.has(concept.code);
                const hasManualQuestion =
                  activeQuestionConceptIds.has(concept.id) ||
                  activeQuestionTopicIds.has(st.topic.id) ||
                  (st.topic.code ? activeQuestionTopicIds.has(st.topic.code) : false);

                if (!hasTemplate && !hasManualQuestion) {
                  errors.push(
                    `Concept "${concept.name}" has no active templates or manual questions mapped in topic "${st.topic.name}"`,
                  );
                }
              }
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
    if (config.difficultyDistribution) {
      const { easyPercentage, mediumPercentage, hardPercentage } =
        config.difficultyDistribution;
      const total = easyPercentage + mediumPercentage + hardPercentage;
      if (total !== 100 && total !== 0) {
        errors.push(
          `Difficulty distribution must total 100% or 0% (currently ${total}%: Easy ${easyPercentage}% + Medium ${mediumPercentage}% + Hard ${hardPercentage}%)`,
        );
      }
    } else {
      errors.push("Exam configuration must have a difficulty distribution configured");
    }

    // ─── Template Layer (advisory) ───────────────────────────────────────────
    // Removed the global template count check as we now check templates hierarchically.

    const valid = errors.length === 0;
    return { valid, errors, warnings };
  }
}
