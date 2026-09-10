import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { BlueprintRepository } from "../repositories/blueprint.repository";
import { TopicRegistryLoader } from "../../concept-mapping/services/topic-registry-loader.service";
import { TemplateRepository } from "../../template-library/repositories/template.repository";
import { PrismaService } from "../../../prisma/prisma.service";
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
  private templateCache: { templates: any[]; cachedAt: number } | null = null;

  constructor(
    private readonly repository: BlueprintRepository,
    private readonly topicRegistryLoader: TopicRegistryLoader,
    private readonly templateRepository: TemplateRepository,
    private readonly prisma: PrismaService,
  ) {}

  private async getCachedTemplates(): Promise<any[]> {
    if (this.templateCache && Date.now() - this.templateCache.cachedAt < 60000) {
      return this.templateCache.templates;
    }
    const templates = await this.templateRepository.findAll();
    this.templateCache = { templates, cachedAt: Date.now() };
    return templates;
  }

  async create(dto: CreateBlueprintDto) {
    let { configId, styleProfileId, sections } = dto;

    if (!configId) {
      const name = (dto as any).name || `Config (${Date.now()})`;
      const code = (dto as any).code || `CFG_${Date.now()}`;
      const newConfig = await this.prisma.examConfig.create({
        data: {
          name,
          code,
          role: "Software Engineer",
          durationMinutes: (dto as any).totalDurationMinutes || 60,
          totalQuestions: (dto as any).totalQuestions || 30,
          status: "DRAFT",
        },
      });
      configId = newConfig.id;
    }

    if (!styleProfileId) {
      let activeProfile = await this.prisma.styleProfile.findFirst({
        where: { status: "ACTIVE", active: true },
      });
      if (!activeProfile) {
        activeProfile = await this.prisma.styleProfile.create({
          data: {
            name: "Default Standard Profile",
            profileType: "DEFAULT",
            status: "ACTIVE",
            active: true,
          },
        });
      }
      styleProfileId = activeProfile.id;
    }

    const styleProfile = await this.prisma.styleProfile.findUnique({
      where: { id: styleProfileId },
    });
    if (!styleProfile) {
      throw new BadRequestException("Selected Style Profile does not exist.");
    }
    if (!styleProfile.active || styleProfile.status !== "ACTIVE") {
      throw new BadRequestException("Selected Style Profile is inactive.");
    }

    if (
      (!sections || (Array.isArray(sections) && sections.length === 0)) &&
      configId
    ) {
      const existingConfig = await this.prisma.examConfig.findUnique({
        where: { id: configId },
        include: {
          difficultyDistribution: true,
          sections: {
            include: {
              sectionTopics: true,
            },
          },
        },
      });

      if (existingConfig && existingConfig.sections.length > 0) {
        const diffAlloc = existingConfig.difficultyDistribution
          ? {
              easy: existingConfig.difficultyDistribution.easyPercentage ?? 0,
              medium:
                existingConfig.difficultyDistribution.mediumPercentage ?? 0,
              hard: existingConfig.difficultyDistribution.hardPercentage ?? 0,
            }
          : { easy: 0, medium: 0, hard: 0 };

        sections = existingConfig.sections.map((sec) => ({
          sectionId: sec.id,
          sectionKey: sec.code || sec.id,
          displayName: sec.name,
          questionCount: sec.questionCount || 5,
          difficultyAllocation: diffAlloc,
          topicAllocations: (sec.sectionTopics || []).map((st) => ({
            topicId: st.topicId,
            percentage: Math.round(100 / (sec.sectionTopics.length || 1)),
          })),
        })) as any;
      }
    }

    const tempBlueprint = {
      configId,
      styleProfileId,
      sections: sections as any,
    } as Blueprint;
    const validationSummary = await this.validateBlueprintObject(tempBlueprint);
    if (!validationSummary.valid) {
      throw new BadRequestException({
        message: "Blueprint validation failed",
        errors: validationSummary.errors,
        details: validationSummary.errors,
      });
    }

    // Check if blueprint already exists for this config
    const existing = await this.repository.findByConfigId(configId);
    if (existing) {
      const updated = await this.repository.update(existing.id, {
        styleProfile: { connect: { id: styleProfileId } },
        sections: sections as unknown as Prisma.InputJsonValue,
      });
      await this.syncBlueprintSectionsToConfig(configId, sections as any[]);
      return this.mapBlueprintToDto(updated);
    }

    const created = await this.repository.create({
      sections: sections as unknown as Prisma.InputJsonValue,
      examConfig: { connect: { id: configId } },
      styleProfile: { connect: { id: styleProfileId } },
    });
    await this.syncBlueprintSectionsToConfig(configId, sections as any[]);
    return this.mapBlueprintToDto(created);
  }

  public async syncBlueprintSectionsToConfig(
    configId: string,
    blueprintSections: any[],
  ) {
    if (
      !configId ||
      !Array.isArray(blueprintSections) ||
      blueprintSections.length === 0
    )
      return;

    try {
      const existingConfig = await this.prisma.examConfig.findUnique({
        where: { id: configId },
      });

      if (!existingConfig) return;

      await this.prisma.$transaction(async (tx) => {
        // Clear previous sections for this configuration to ensure clean blueprint binding
        await tx.examSection.deleteMany({
          where: { examConfigId: configId },
        });

        // Re-create sections and topic weightages according to the new blueprint
        for (let idx = 0; idx < blueprintSections.length; idx++) {
          const sec = blueprintSections[idx];
          const secName = sec.displayName || sec.name || `Section ${idx + 1}`;
          const secCode = sec.sectionKey || sec.code || `SEC_${idx + 1}`;
          const qCount = sec.questionCount || 10;

          const examSec = await tx.examSection.create({
            data: {
              examConfigId: configId,
              name: secName,
              code: secCode,
              questionCount: qCount,
              sectionOrder: idx + 1,
              sectionDurationMinutes: sec.sectionDurationMinutes || 15,
            },
          });

          const topicAllocs = sec.topicAllocations || sec.sectionTopics || [];
          for (const ta of topicAllocs) {
            const tId = ta.topicId || ta.id;
            if (tId) {
              const newSt = await tx.sectionTopic.create({
                data: {
                  sectionId: examSec.id,
                  topicId: tId,
                },
              });
              await tx.topicWeightage.create({
                data: {
                  id: newSt.id,
                  sectionId: examSec.id,
                  topicId: tId,
                  weightagePercentage:
                    ta.percentage ??
                    ta.weightagePercentage ??
                    ta.weightage ??
                    50,
                },
              });
            }
          }
        }
      });
    } catch (err) {
      console.warn(
        "Failed to sync blueprint sections to ExamSection table:",
        err,
      );
    }
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
    const existing = await this.repository.findByIdWithRelations(id);
    if (!existing) {
      throw new NotFoundException(`Blueprint with ID ${id} not found`);
    }

    const styleProfileId =
      dto.styleProfileId !== undefined
        ? dto.styleProfileId
        : existing.styleProfileId;
    const sections =
      dto.sections !== undefined ? dto.sections : existing.sections;

    if (!styleProfileId) {
      throw new BadRequestException(
        "No Style Profile selected. Please assign a Style Profile before saving the Blueprint.",
      );
    }
    const styleProfile = await this.prisma.styleProfile.findUnique({
      where: { id: styleProfileId },
    });
    if (!styleProfile) {
      throw new BadRequestException("Selected Style Profile does not exist.");
    }
    if (!styleProfile.active || styleProfile.status !== "ACTIVE") {
      throw new BadRequestException("Selected Style Profile is inactive.");
    }

    const tempBlueprint = {
      id,
      configId: existing.configId,
      styleProfileId,
      sections: sections as any,
    } as Blueprint;
    const validationSummary = await this.validateBlueprintObject(tempBlueprint);
    if (!validationSummary.valid) {
      throw new BadRequestException({
        message: "Blueprint validation failed",
        errors: validationSummary.errors,
        details: validationSummary.errors,
      });
    }

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
    const rawSections = blueprint.sections;
    const sections = Array.isArray(rawSections)
      ? (rawSections as unknown as BlueprintSection[])
      : [];
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

    // Style Profile Checks
    if (!blueprint.styleProfileId) {
      errors.push(
        "No Style Profile selected. Please assign a Style Profile before saving the Blueprint.",
      );
    } else {
      const styleProfile = await this.prisma.styleProfile.findUnique({
        where: { id: blueprint.styleProfileId },
      });
      if (!styleProfile) {
        errors.push("Selected Style Profile does not exist.");
      } else if (!styleProfile.active || styleProfile.status !== "ACTIVE") {
        errors.push("Selected Style Profile is inactive.");
      }
    }

    const rawSections = blueprint.sections;
    const sections = Array.isArray(rawSections)
      ? (rawSections as unknown as BlueprintSection[])
      : [];
    if (sections.length === 0) {
      errors.push("Blueprint must contain at least one section");
      return { valid: errors.length === 0, errors };
    }

    // Pre-fetch all topics for all allocations in all sections
    const allTopicAllocations = sections.flatMap(
      (s) => s.topicAllocations || [],
    );
    const uniqueTopicIds = Array.from(
      new Set(allTopicAllocations.map((a) => a.topicId)),
    );

    const topicMap = new Map<string, any>();
    await Promise.all(
      uniqueTopicIds.map(async (tid) => {
        const t = await this.topicRegistryLoader.getTopicById(tid);
        if (t) topicMap.set(tid, t);
      }),
    );

    // Collect all concept codes from all allocated topics
    const allConceptCodes = Array.from(
      new Set(Array.from(topicMap.values()).flatMap((t: any) => t.concepts || [])),
    );

    // Batch fetch concepts AND lightweight templates matching these codes concurrently
    const [dbConcepts, templates] = await Promise.all([
      allConceptCodes.length > 0
        ? this.prisma.concept.findMany({
            where: { code: { in: allConceptCodes } },
            select: { id: true, code: true },
          })
        : [],
      allConceptCodes.length > 0
        ? this.prisma.template.findMany({
            where: {
              conceptKey: { in: allConceptCodes },
              isActive: true,
              deletedAt: null,
            },
            select: {
              conceptKey: true,
              difficultyLevel: true,
              isActive: true,
            },
          })
        : [],
    ]);

    const conceptIdByCode = new Map<string, string>();
    const allConceptIds = dbConcepts.map((c: any) => {
      conceptIdByCode.set(c.code, c.id);
      return c.id;
    });

    // Batch count manual questions by conceptId and difficulty
    const manualQuestionCounts =
      allConceptIds.length > 0
        ? await this.prisma.question.groupBy({
            by: ["conceptId", "difficulty"],
            where: {
              conceptId: { in: allConceptIds },
              status: "ACTIVE",
            },
            _count: { id: true },
          })
        : [];

    const questionCountMap = new Map<string, number>();
    const availableDifficultiesByConcept = new Map<string, Set<string>>();
    for (const q of manualQuestionCounts) {
      if (q.conceptId) {
        questionCountMap.set(`${q.conceptId}:${q.difficulty}`, q._count.id);
        const set =
          availableDifficultiesByConcept.get(q.conceptId) ||
          new Set<string>();
        set.add(q.difficulty);
        availableDifficultiesByConcept.set(q.conceptId, set);
      }
    }

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
      if (diffSum !== 0 && diffSum !== 100) {
        errors.push(
          `Section "${sectionName}": Difficulty allocation total must be 0% (Flexible Pool Mode) or exactly 100%, currently ${diffSum}%`,
        );
      }

      // 3. Topic Existence Check
      for (const alloc of topicAllocations) {
        const topic = topicMap.get(alloc.topicId);
        if (!topic) {
          errors.push(
            `Section "${sectionName}": Topic "${alloc.topicId}" does not exist in Topic Registry`,
          );
          continue;
        }

        const topicConceptIds = (topic.concepts || [])
          .map((code: string) => conceptIdByCode.get(code))
          .filter((id: string | undefined): id is string => Boolean(id));

        // 4. Template Availability Check (in-memory O(1) checks)
        const checkDifficulty = (
          diffKey: "easy" | "medium" | "hard",
          level: DifficultyLevel,
        ) => {
          const allocPct = diffAlloc[diffKey] || 0;
          if (allocPct > 0) {
            const matchingTemplates = templates.filter(
              (t) =>
                t.isActive &&
                t.difficultyLevel === level &&
                topic.concepts.includes(t.conceptKey),
            );

            let availableManualCount = 0;
            for (const cid of topicConceptIds) {
              availableManualCount +=
                questionCountMap.get(`${cid}:${level}`) || 0;
            }

            if (matchingTemplates.length === 0 && availableManualCount === 0) {
              const availableDifficulties = new Set<string>();

              templates
                .filter(
                  (t) => t.isActive && topic.concepts.includes(t.conceptKey),
                )
                .forEach((t) => availableDifficulties.add(t.difficultyLevel));

              for (const cid of topicConceptIds) {
                const diffs = availableDifficultiesByConcept.get(cid);
                if (diffs) {
                  diffs.forEach((d) => availableDifficulties.add(d));
                }
              }

              const suggestion =
                availableDifficulties.size > 0
                  ? `Please assign weight to: [${Array.from(availableDifficulties).join(", ")}].`
                  : "Please create active templates or manual questions for this topic first.";

              errors.push(
                `Topic "${topic.topic}" does not have any active "${level}" templates or manual questions. ${suggestion}`,
              );
            }
          }
        };

        checkDifficulty("easy", DifficultyLevel.EASY);
        checkDifficulty("medium", DifficultyLevel.MEDIUM);
        checkDifficulty("hard", DifficultyLevel.HARD);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async preview(id: string) {
    const blueprint = await this.findOne(id);
    const rawSections = blueprint.sections;
    const sections = Array.isArray(rawSections)
      ? (rawSections as unknown as BlueprintSection[])
      : [];

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

    const config = (blueprint as any).examConfig || (blueprint as any).config;
    const styleProfile = (blueprint as any).styleProfile;
    const bpId = (blueprint as any).id || (blueprint as any).blueprintId || "";
    const name =
      config?.displayName ||
      config?.name ||
      styleProfile?.name ||
      `Blueprint (${bpId.slice(0, 8)})`;
    const code = config?.code || config?.configKey || bpId;

    return {
      id: bpId,
      blueprintId: bpId,
      name,
      displayName: name,
      title: name,
      code,
      configId: blueprint.configId,
      styleProfileId: blueprint.styleProfileId,
      status: (blueprint as any).status || "ACTIVE",
      isActive:
        (blueprint as any).status === "ACTIVE" ||
        (blueprint as any).active !== false,
      sections: previewSections,
      createdAt: (blueprint as any).createdAt || new Date().toISOString(),
      updatedAt: (blueprint as any).updatedAt || new Date().toISOString(),
    };
  }
}
