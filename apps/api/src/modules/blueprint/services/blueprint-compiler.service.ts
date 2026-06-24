import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../../../prisma/prisma.service";
import { BlueprintService } from "./blueprint.service";
import {
  GenerationRequest,
  GenerationBatch,
  BlueprintSection,
  TopicAllocation,
} from "@intervu-ai/contracts";
import { DifficultyLevel } from "@prisma/client";

export interface CompilationValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class BlueprintCompilerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blueprintService: BlueprintService,
  ) {}

  /**
   * Main compilation endpoint: validates the blueprint prerequisites and executes compilation.
   */
  async compileBlueprint(blueprintId: string): Promise<GenerationBatch> {
    const validation = await this.validateCompilation(blueprintId);
    if (!validation.valid) {
      throw new BadRequestException({
        message: "Blueprint compilation failed validation",
        errors: validation.errors,
      });
    }

    const blueprint = await this.prisma.blueprint.findUnique({
      where: { id: blueprintId },
    });

    if (!blueprint) {
      throw new NotFoundException(`Blueprint with ID ${blueprintId} not found`);
    }

    const requests = await this.generateRequests(blueprint);

    return {
      batchId: randomUUID(),
      blueprintId: blueprint.id,
      requests,
    };
  }

  /**
   * Dry-run preview: executes the compilation logic without throwing validation errors (returns them instead).
   */
  async previewCompilation(blueprintId: string) {
    const blueprint = await this.prisma.blueprint.findUnique({
      where: { id: blueprintId },
    });

    if (!blueprint) {
      throw new NotFoundException(`Blueprint with ID ${blueprintId} not found`);
    }

    const sectionsData = blueprint.sections as unknown as BlueprintSection[];
    const requests = await this.generateRequests(blueprint);

    const sectionsPreview = await Promise.all(
      sectionsData.map(async (section) => {
        const allocations = this.allocateQuestions(
          section.questionCount,
          section.topicAllocations.map((t) => ({
            id: t.topicId,
            percentage: t.percentage,
          })),
        );

        const topicAllocationsPreview = await Promise.all(
          section.topicAllocations.map(async (alloc) => {
            const topicTotal = allocations[alloc.topicId] || 0;
            const diffAllocations = this.expandDifficulty(
              topicTotal,
              section.difficultyAllocation,
            );

            // Fetch topic name
            const topicDb = await this.prisma.topic.findUnique({
              where: { id: alloc.topicId },
            });

            return {
              topicId: alloc.topicId,
              topicName: topicDb?.name || alloc.topicId,
              total: topicTotal,
              byDifficulty: {
                EASY: diffAllocations.EASY || 0,
                MEDIUM: diffAllocations.MEDIUM || 0,
                HARD: diffAllocations.HARD || 0,
              },
            };
          }),
        );

        return {
          sectionId: section.sectionId,
          questionCount: section.questionCount,
          allocations: topicAllocationsPreview,
        };
      }),
    );

    return {
      sections: sectionsPreview,
      requests,
    };
  }

  /**
   * Audits the blueprint and its readiness constraints.
   */
  async validateCompilation(blueprintId: string): Promise<CompilationValidationResult> {
    const errors: string[] = [];

    const blueprint = await this.prisma.blueprint.findUnique({
      where: { id: blueprintId },
      include: { examConfig: true },
    });

    if (!blueprint) {
      errors.push(`Blueprint with ID ${blueprintId} not found`);
      return { valid: false, errors };
    }

    // 1. Blueprint Invalid
    const bpValidation = await this.blueprintService.validate(blueprintId);
    if (!bpValidation.valid) {
      errors.push(...bpValidation.errors.map((e) => `Blueprint Invalid: ${e}`));
    }

    // 2. Readiness Not READY
    const latestReport = await this.prisma.readinessReport.findFirst({
      where: { configId: blueprint.configId },
      orderBy: { createdAt: "desc" },
    });

    if (!latestReport || latestReport.status !== "READY") {
      errors.push("Readiness Not READY");
    }

    const sections = blueprint.sections as unknown as BlueprintSection[];
    if (sections && sections.length > 0) {
      for (const section of sections) {
        const topicAllocations = section.topicAllocations || [];
        for (const alloc of topicAllocations) {
          // 3. No Concepts Found
          const concepts = await this.prisma.concept.findMany({
            where: { topicId: alloc.topicId, status: "ACTIVE" },
          });

          if (concepts.length === 0) {
            errors.push(`No Concepts Found for topic '${alloc.topicId}'`);
            continue;
          }

          const conceptCodes = concepts.map((c) => c.code);

          // 4. No Templates Found
          const allocations = this.allocateQuestions(
            section.questionCount,
            section.topicAllocations.map((t) => ({
              id: t.topicId,
              percentage: t.percentage,
            })),
          );

          const topicTotal = allocations[alloc.topicId] || 0;
          if (topicTotal > 0) {
            const diffAllocations = this.expandDifficulty(
              topicTotal,
              section.difficultyAllocation,
            );

            const checkDifficultyTemplateCoverage = async (
              diffKey: "EASY" | "MEDIUM" | "HARD",
              level: DifficultyLevel,
            ) => {
              const qty = diffAllocations[diffKey] || 0;
              if (qty > 0) {
                const templates = await this.prisma.template.findMany({
                  where: {
                    conceptKey: { in: conceptCodes },
                    difficultyLevel: level,
                    isActive: true,
                    deletedAt: null,
                  },
                });

                let matchingTemplates = templates;
                if (section.templateTypes && section.templateTypes.length > 0) {
                  const allowedTypes = section.templateTypes.map((t) =>
                    t.toLowerCase(),
                  );
                  matchingTemplates = templates.filter((t) =>
                    allowedTypes.includes(t.questionType.toLowerCase()),
                  );
                }

                if (matchingTemplates.length === 0) {
                  errors.push(
                    `No Templates Found for topic '${alloc.topicId}' at difficulty level '${level}'`,
                  );
                }
              }
            };

            await checkDifficultyTemplateCoverage("EASY", DifficultyLevel.EASY);
            await checkDifficultyTemplateCoverage("MEDIUM", DifficultyLevel.MEDIUM);
            await checkDifficultyTemplateCoverage("HARD", DifficultyLevel.HARD);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generates requests for a validated blueprint.
   */
  async generateRequests(blueprint: any): Promise<GenerationRequest[]> {
    const requests: GenerationRequest[] = [];
    const sections = blueprint.sections as unknown as BlueprintSection[];

    if (!sections) return [];

    for (const section of sections) {
      // 1. Allocate section questions to topics
      const topicAllocations = this.allocateQuestions(
        section.questionCount,
        section.topicAllocations.map((t) => ({
          id: t.topicId,
          percentage: t.percentage,
        })),
      );

      for (const alloc of section.topicAllocations) {
        const topicTotal = topicAllocations[alloc.topicId] || 0;
        if (topicTotal === 0) continue;

        // 2. Expand topic total to difficulty levels
        const diffAllocations = this.expandDifficulty(
          topicTotal,
          section.difficultyAllocation,
        );

        const concepts = await this.prisma.concept.findMany({
          where: { topicId: alloc.topicId, status: "ACTIVE" },
        });
        const conceptCodes = concepts.map((c) => c.code);

        const processDifficulty = async (
          diffKey: "EASY" | "MEDIUM" | "HARD",
          level: DifficultyLevel,
        ) => {
          const qty = diffAllocations[diffKey] || 0;
          if (qty === 0) return;

          // 3. Find templates
          const templates = await this.prisma.template.findMany({
            where: {
              conceptKey: { in: conceptCodes },
              difficultyLevel: level,
              isActive: true,
              deletedAt: null,
            },
          });

          let matchingTemplates = templates;
          if (section.templateTypes && section.templateTypes.length > 0) {
            const allowedTypes = section.templateTypes.map((t) =>
              t.toLowerCase(),
            );
            matchingTemplates = templates.filter((t) =>
              allowedTypes.includes(t.questionType.toLowerCase()),
            );
          }

          if (matchingTemplates.length === 0) {
            return; // In theory validated beforehand
          }

          // Deterministic template sort to ensure repeatable selection
          matchingTemplates.sort((a, b) => a.templateKey.localeCompare(b.templateKey));

          // 4. Distribute quantity among templates as evenly as possible using Largest Remainder Method
          const templateQuantities = this.allocateQuestions(
            qty,
            matchingTemplates.map((t) => ({
              id: t.id,
              percentage: 100 / matchingTemplates.length,
            })),
          );

          for (const template of matchingTemplates) {
            const templateQty = templateQuantities[template.id] || 0;
            if (templateQty === 0) continue;

            const targetConcept = concepts.find((c) => c.code === template.conceptKey);

            requests.push({
              requestId: randomUUID(),
              blueprintId: blueprint.id,
              sectionId: section.sectionId,
              topicId: alloc.topicId,
              conceptId: targetConcept?.id || template.conceptKey,
              difficulty: diffKey,
              templateId: template.id,
              quantity: templateQty,
            });
          }
        };

        await processDifficulty("EASY", DifficultyLevel.EASY);
        await processDifficulty("MEDIUM", DifficultyLevel.MEDIUM);
        await processDifficulty("HARD", DifficultyLevel.HARD);
      }
    }

    return requests;
  }

  /**
   * Largest Remainder Method for allocating a total count among percentage weights.
   */
  allocateQuestions(
    total: number,
    items: Array<{ id: string; percentage: number }>,
  ): Record<string, number> {
    const allocations: Record<string, number> = {};
    if (items.length === 0) return allocations;

    let sum = 0;
    const fractions: Array<{ id: string; fraction: number }> = [];

    for (const item of items) {
      const raw = total * (item.percentage / 100);
      const initial = Math.floor(raw);
      allocations[item.id] = initial;
      sum += initial;
      fractions.push({
        id: item.id,
        fraction: raw - initial,
      });
    }

    const remainder = total - sum;

    // Sort by fraction descending. Break ties alphabetically.
    fractions.sort((a, b) => {
      if (Math.abs(a.fraction - b.fraction) > 1e-9) {
        return b.fraction - a.fraction;
      }
      return a.id.localeCompare(b.id);
    });

    for (let i = 0; i < remainder; i++) {
      const target = fractions[i % fractions.length];
      allocations[target.id] = (allocations[target.id] || 0) + 1;
    }

    return allocations;
  }

  /**
   * Largest Remainder Method for difficulty distribution.
   */
  expandDifficulty(
    total: number,
    dist: { easy: number; medium: number; hard: number },
  ): Record<string, number> {
    const allocations: Record<string, number> = { EASY: 0, MEDIUM: 0, HARD: 0 };
    if (total === 0) return allocations;

    const items = [
      { id: "EASY", percentage: dist.easy },
      { id: "MEDIUM", percentage: dist.medium },
      { id: "HARD", percentage: dist.hard },
    ];

    let sum = 0;
    const fractions: Array<{ id: string; fraction: number }> = [];

    for (const item of items) {
      const raw = total * (item.percentage / 100);
      const initial = Math.floor(raw);
      allocations[item.id] = initial;
      sum += initial;
      fractions.push({
        id: item.id,
        fraction: raw - initial,
      });
    }

    const remainder = total - sum;

    // Sort descending fraction. Break ties in order: HARD -> MEDIUM -> EASY.
    const difficultyOrder: Record<string, number> = { HARD: 3, MEDIUM: 2, EASY: 1 };
    fractions.sort((a, b) => {
      if (Math.abs(a.fraction - b.fraction) > 1e-9) {
        return b.fraction - a.fraction;
      }
      return (difficultyOrder[b.id] || 0) - (difficultyOrder[a.id] || 0);
    });

    for (let i = 0; i < remainder; i++) {
      const target = fractions[i % fractions.length];
      allocations[target.id] = (allocations[target.id] || 0) + 1;
    }

    return allocations;
  }
}
