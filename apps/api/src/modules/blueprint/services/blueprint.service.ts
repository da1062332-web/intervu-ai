import { Injectable, NotFoundException } from "@nestjs/common";
import { BlueprintRepository } from "../repositories/blueprint.repository";
import { TopicRegistryLoader } from "../../concept-mapping/services/topic-registry-loader.service";
import { TemplateRepository } from "../../template-library/repositories/template.repository";
import { CreateBlueprintDto, UpdateBlueprintDto } from "@intervu/shared";
import {
  DifficultyLevel,
  Prisma,
  Blueprint,
  ExamConfig,
  StyleProfile,
} from "@prisma/client";
import { BlueprintSection, TopicAllocation } from "@intervu-ai/contracts";

export interface BlueprintValidationResult {
  valid: boolean;
  errors: string[];
}

export interface BlueprintWithRelations extends Blueprint {
  examConfig?: ExamConfig | null;
  styleProfile?: StyleProfile | null;
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
    const blueprints = await this.repository.findAllWithRelations();
    return blueprints.map((bp) => this.mapBlueprintToDto(bp));
  }

  async findOne(id: string) {
    const blueprint = await this.repository.findByIdWithRelations(id);
    if (!blueprint) {
      throw new NotFoundException(`Blueprint with ID ${id} not found`);
    }
    const validationSummary = await this.validateBlueprintObject(blueprint);
    const dto = this.mapBlueprintToDto(blueprint);
    return {
      ...dto,
      valid: validationSummary.valid,
      validationSummary,
    };
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

    const updated = await this.repository.update(id, updateData);
    return this.findOne(updated.id);
  }

  async validate(id: string): Promise<BlueprintValidationResult> {
    const blueprint = await this.repository.findByIdWithRelations(id);
    if (!blueprint) {
      throw new NotFoundException(`Blueprint with ID ${id} not found`);
    }
    return this.validateBlueprintObject(blueprint);
  }

  mapBlueprintToDto(blueprint: BlueprintWithRelations) {
    if (!blueprint) return null;
    const sections =
      (blueprint.sections as unknown as BlueprintSection[]) || [];
    const topics: Array<{
      topicName: string;
      sectionName: string;
      questionCount: number;
      weightage: number;
      difficultyDistribution: {
        easyCount: number;
        mediumCount: number;
        hardCount: number;
      };
    }> = [];

    for (const sec of sections) {
      const sectionName = sec.sectionId || "Section";
      const qCount = sec.questionCount || 0;
      const topicAllocations = sec.topicAllocations || [];
      const diffAlloc = sec.difficultyAllocation || {
        easy: 0,
        medium: 0,
        hard: 0,
      };

      for (const t of topicAllocations) {
        const topicQuestionCount = Math.round(
          qCount * ((t.percentage || 0) / 100),
        );
        topics.push({
          topicName: t.topicId,
          sectionName: sectionName,
          questionCount: topicQuestionCount,
          weightage: t.percentage || 0,
          difficultyDistribution: {
            easyCount: Math.round(
              topicQuestionCount * ((diffAlloc.easy || 0) / 100),
            ),
            mediumCount: Math.round(
              topicQuestionCount * ((diffAlloc.medium || 0) / 100),
            ),
            hardCount: Math.round(
              topicQuestionCount * ((diffAlloc.hard || 0) / 100),
            ),
          },
        });
      }
    }

    return {
      id: blueprint.id,
      configId: blueprint.configId,
      styleProfileId: blueprint.styleProfileId,
      styleProfileName: blueprint.styleProfile?.name || "",
      sections: blueprint.sections,
      createdAt: blueprint.createdAt,
      updatedAt: blueprint.updatedAt,
      name: blueprint.examConfig?.name || "",
      code: blueprint.examConfig?.code || "",
      totalQuestions: blueprint.examConfig?.totalQuestions || 0,
      totalDurationMinutes: blueprint.examConfig?.durationMinutes || 0,
      isActive: blueprint.examConfig?.isActive ?? false,
      examConfig: blueprint.examConfig,
      styleProfile: blueprint.styleProfile,
      topics,
    };
  }

  async validateBlueprintObject(
    blueprint: Blueprint,
  ): Promise<BlueprintValidationResult> {
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
      const topicSum = topicAllocations.reduce(
        (sum: number, t: TopicAllocation) => sum + (t.percentage || 0),
        0,
      );
      if (topicSum !== 100) {
        errors.push(
          `Section "${sectionName}": Topic allocation total must be exactly 100%, currently ${topicSum}%`,
        );
      }

      // 2. Difficulty Allocation Total Check
      const diffAlloc = section.difficultyAllocation || {
        easy: 0,
        medium: 0,
        hard: 0,
      };
      const diffSum =
        (diffAlloc.easy || 0) + (diffAlloc.medium || 0) + (diffAlloc.hard || 0);
      if (diffSum !== 100) {
        errors.push(
          `Section "${sectionName}": Difficulty allocation total must be exactly 100%, currently ${diffSum}%`,
        );
      }

      // 3. Topic Existence Check
      for (const alloc of topicAllocations) {
        const topic = await this.topicRegistryLoader.getTopicById(
          alloc.topicId,
        );
        if (!topic) {
          errors.push(
            `Section "${sectionName}": Topic "${alloc.topicId}" does not exist in Topic Registry`,
          );
          continue;
        }

        // 4. Template Availability Check
        // If a topic is allocated and a difficulty is allocated, verify there is at least one active template in the DB
        const checkDifficulty = async (
          diffKey: "easy" | "medium" | "hard",
          level: DifficultyLevel,
        ) => {
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
      const diffAlloc = section.difficultyAllocation || {
        easy: 0,
        medium: 0,
        hard: 0,
      };

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
