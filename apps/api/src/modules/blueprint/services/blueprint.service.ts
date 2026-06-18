import { Injectable, NotFoundException } from "@nestjs/common";
import { BlueprintRepository } from "../repositories/blueprint.repository";
import { TopicRegistryLoader } from "../../concept-mapping/services/topic-registry-loader.service";
import { TemplateRepository } from "../../template-library/repositories/template.repository";
import { CreateBlueprintDto, UpdateBlueprintDto } from "@intervu/shared";
import { DifficultyLevel, Prisma } from "@prisma/client";
import { BlueprintSection, TopicAllocation } from "@intervu-ai/contracts";

export interface BlueprintValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class BlueprintService {
  constructor(
    private readonly repository: BlueprintRepository,
    private readonly topicRegistryLoader: TopicRegistryLoader,
    private readonly templateRepository: TemplateRepository,
  ) {}

  async create(dto: CreateBlueprintDto) {
    const { configId, styleProfileId, sections } = dto;

    // Check if blueprint already exists for this config
    const existing = await this.repository.findByConfigId(configId);
    if (existing) {
      return this.repository.update(existing.id, {
        styleProfile: { connect: { id: styleProfileId } },
        sections: sections as unknown as Prisma.InputJsonValue,
      });
    }

    return this.repository.create({
      sections: sections as unknown as Prisma.InputJsonValue,
      examConfig: { connect: { id: configId } },
      styleProfile: { connect: { id: styleProfileId } },
    });
  }

  async findAll() {
    return this.repository.findAllWithRelations();
  }

  async findOne(id: string) {
    const blueprint = await this.repository.findByIdWithRelations(id);
    if (!blueprint) {
      throw new NotFoundException(`Blueprint with ID ${id} not found`);
    }
    return blueprint;
  }

  async update(id: string, dto: UpdateBlueprintDto) {
    await this.findOne(id);
    const updateData: Prisma.BlueprintUpdateInput = {};
    if (dto.styleProfileId) {
      updateData.styleProfile = { connect: { id: dto.styleProfileId } };
    }
    if (dto.sections) {
      updateData.sections = dto.sections as unknown as Prisma.InputJsonValue;
    }

    return this.repository.update(id, updateData);
  }

  async validate(id: string): Promise<BlueprintValidationResult> {
    const blueprint = await this.findOne(id);
    const errors: string[] = [];

    const sections = blueprint.sections as unknown as BlueprintSection[];
    if (!sections || sections.length === 0) {
      errors.push("Blueprint must contain at least one section");
      return { valid: false, errors };
    }

    // Load active templates from template library to verify availability
    const templates = await this.templateRepository.findAll();

    for (const section of sections) {
      const sectionName = section.sectionId || "Unnamed Section";

      // 1. Topic Allocation Total Check
      const topicAllocations = section.topicAllocations || [];
      const topicSum = topicAllocations.reduce((sum: number, t: TopicAllocation) => sum + (t.percentage || 0), 0);
      if (topicSum !== 100) {
        errors.push(`Section "${sectionName}": Topic allocation total must be exactly 100%, currently ${topicSum}%`);
      }

      // 2. Difficulty Allocation Total Check
      const diffAlloc = section.difficultyAllocation || { easy: 0, medium: 0, hard: 0 };
      const diffSum = (diffAlloc.easy || 0) + (diffAlloc.medium || 0) + (diffAlloc.hard || 0);
      if (diffSum !== 100) {
        errors.push(`Section "${sectionName}": Difficulty allocation total must be exactly 100%, currently ${diffSum}%`);
      }

      // 3. Topic Existence Check
      for (const alloc of topicAllocations) {
        const topic = await this.topicRegistryLoader.getTopicById(alloc.topicId);
        if (!topic) {
          errors.push(`Section "${sectionName}": Topic "${alloc.topicId}" does not exist in Topic Registry`);
          continue;
        }

        // 4. Template Availability Check
        // If a topic is allocated and a difficulty is allocated, verify there is at least one active template in the DB
        const checkDifficulty = async (diffKey: "easy" | "medium" | "hard", level: DifficultyLevel) => {
          const allocPct = diffAlloc[diffKey] || 0;
          if (allocPct > 0) {
            // Find templates that match the topic's concepts and the required difficulty level
            const matchingTemplates = templates.filter(
              (t) =>
                t.isActive &&
                t.difficultyLevel === level &&
                topic.concepts.includes(t.conceptKey),
            );

            if (matchingTemplates.length === 0) {
              errors.push(
                `Section "${sectionName}": No active templates found for topic "${topic.topic}" at difficulty level "${level}"`,
              );
            }
          }
        };

        await checkDifficulty("easy", DifficultyLevel.EASY);
        await checkDifficulty("medium", DifficultyLevel.MEDIUM);
        await checkDifficulty("hard", DifficultyLevel.HARD);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async preview(id: string) {
    const blueprint = await this.findOne(id);
    const sections = blueprint.sections as unknown as BlueprintSection[];

    const previewSections = sections.map((section: BlueprintSection) => {
      const qCount = section.questionCount || 0;
      const topicAllocations = section.topicAllocations || [];
      const diffAlloc = section.difficultyAllocation || { easy: 0, medium: 0, hard: 0 };

      const topics = topicAllocations.map((t: TopicAllocation) => {
        const count = Math.round((t.percentage / 100) * qCount);
        return {
          topicId: t.topicId,
          percentage: t.percentage,
          expectedQuestions: count,
        };
      });

      return {
        sectionId: section.sectionId,
        questionCount: qCount,
        topics,
        difficultyAllocation: {
          easy: Math.round((diffAlloc.easy / 100) * qCount),
          medium: Math.round((diffAlloc.medium / 100) * qCount),
          hard: Math.round((diffAlloc.hard / 100) * qCount),
        },
      };
    });

    return {
      blueprintId: blueprint.id,
      configId: blueprint.configId,
      styleProfileId: blueprint.styleProfileId,
      sections: previewSections,
    };
  }
}
