import { Injectable } from "@nestjs/common";
import { ConfigStatus, TemplateVariable } from "@prisma/client";
import { ExamConfigRepository } from "../../admin-config/repositories/exam-config.repository";
import { ExamSectionRepository } from "../../admin-config/repositories/exam-section.repository";
import { TopicRepository } from "../../concept-mapping/repositories/topic.repository";
import { ConceptMappingRepository } from "../../concept-mapping/repositories/concept-mapping.repository";
import { TopicSectionMappingRepository } from "../../topic-section-mapping/repositories/topic-section-mapping.repository";
import { TopicWeightageRepository } from "../../topic-section-mapping/repositories/topic-weightage.repository";
import { TemplateRepository } from "../../template-library/repositories/template.repository";
import { TemplateVariableRepository } from "../../template-library/repositories/template-variable.repository";
import { TemplateRuleRepository } from "../../template-library/repositories/template-rule.repository";
import { BlueprintService } from "../../blueprint/services/blueprint.service";
import { BlueprintRepository } from "../../blueprint/repositories/blueprint.repository";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class CrossModuleValidatorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly examConfigRepository: ExamConfigRepository,
    private readonly examSectionRepository: ExamSectionRepository,
    private readonly topicRepository: TopicRepository,
    private readonly conceptMappingRepository: ConceptMappingRepository,
    private readonly topicSectionMappingRepository: TopicSectionMappingRepository,
    private readonly topicWeightageRepository: TopicWeightageRepository,
    private readonly templateRepository: TemplateRepository,
    private readonly templateVariableRepository: TemplateVariableRepository,
    private readonly templateRuleRepository: TemplateRuleRepository,
    private readonly blueprintService: BlueprintService,
    private readonly blueprintRepository: BlueprintRepository,
  ) {}

  private checkDefaultValueType(val: string, type: string): boolean {
    if (type === "STRING" || type === "CODE") {
      return true;
    }
    if (type === "NUMBER") {
      const num = Number(val);
      return !isNaN(num);
    }
    if (type === "BOOLEAN") {
      return val === "true" || val === "false";
    }
    if (type === "ARRAY") {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed);
      } catch {
        return false;
      }
    }
    return false;
  }

  private validateRuleConfigAndCompatibility(
    ruleType: string,
    config: any,
    variables: Array<Pick<TemplateVariable, "variableName" | "variableType">>,
  ): string | null {
    if (ruleType === "DIFFICULTY") {
      if (
        !config ||
        !config.difficulty ||
        !["EASY", "MEDIUM", "HARD", "easy", "medium", "hard"].includes(
          config.difficulty,
        )
      ) {
        return "Difficulty rule config must specify difficulty as 'easy', 'medium' or 'hard'";
      }
      return null;
    }

    if (!config || typeof config.variableName !== "string") {
      return "Rule configuration must specify a variableName";
    }

    const targetVar = variables.find(
      (v) => v.variableName === config.variableName,
    );
    if (!targetVar) {
      return `Rule targets non-existent variable '${config.variableName}'`;
    }

    if (ruleType === "RANGE") {
      if (targetVar.variableType !== "NUMBER") {
        return `Range rule cannot be applied to variable '${targetVar.variableName}' of type ${targetVar.variableType}`;
      }
      if (typeof config.min !== "number" || typeof config.max !== "number") {
        return "Range rule config must specify numeric min and max";
      }
      if (config.min > config.max) {
        return `Range min ${config.min} cannot be greater than max ${config.max}`;
      }
    } else if (ruleType === "LENGTH") {
      if (
        targetVar.variableType !== "STRING" &&
        targetVar.variableType !== "ARRAY" &&
        targetVar.variableType !== "CODE"
      ) {
        return `Length rule cannot be applied to variable '${targetVar.variableName}' of type ${targetVar.variableType}`;
      }
      if (
        typeof config.minLength !== "number" ||
        typeof config.maxLength !== "number"
      ) {
        return "Length rule config must specify integer minLength and maxLength";
      }
      if (config.minLength > config.maxLength) {
        return `Length minLength ${config.minLength} cannot be greater than maxLength ${config.maxLength}`;
      }
    } else if (ruleType === "REGEX") {
      if (
        targetVar.variableType !== "STRING" &&
        targetVar.variableType !== "CODE"
      ) {
        return `Regex rule cannot be applied to variable '${targetVar.variableName}' of type ${targetVar.variableType}`;
      }
      if (typeof config.pattern !== "string") {
        return "Regex rule config must specify pattern string";
      }
      try {
        new RegExp(config.pattern);
      } catch {
        return `Invalid regex pattern: ${config.pattern}`;
      }
    }
    return null;
  }

  async validateConfig(
    configId: string,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Batch fetch config, sections, rule flags, and difficulty distribution concurrently
    const [config, sections, ruleFlags, diffDist] = await Promise.all([
      this.examConfigRepository.findById(configId),
      this.examSectionRepository.findManyByConfigId(configId),
      this.prisma.ruleFlags.findUnique({
        where: { examConfigId: configId },
      }),
      this.prisma.difficultyDistribution.findUnique({
        where: { examConfigId: configId },
      }),
    ]);

    if (
      !config ||
      config.isArchived ||
      config.status === ConfigStatus.ARCHIVED
    ) {
      errors.push(
        `Exam configuration with ID ${configId} not found or is archived`,
      );
      return { valid: false, errors };
    }

    // 2. Sections Exist
    if (sections.length === 0) {
      errors.push("No sections have been configured for this exam config");
    } else {
      const totalSectionQuestions = sections.reduce(
        (sum, s) => sum + s.questionCount,
        0,
      );
      if (totalSectionQuestions !== config.totalQuestions) {
        errors.push(
          `Total section questions (${totalSectionQuestions}) does not match exam configuration questions (${config.totalQuestions})`,
        );
      }
    }

    // 3. Rules Exist
    if (!ruleFlags) {
      errors.push("Rule flags configuration is missing");
    }

    // 4. Difficulty Exists
    if (!diffDist) {
      errors.push("Difficulty distribution configuration is missing");
    } else {
      const sum =
        diffDist.easyPercentage +
        diffDist.mediumPercentage +
        diffDist.hardPercentage;
      if (sum !== 100 && sum !== 0) {
        errors.push(
          `Difficulty distribution total is ${sum}%, must equal 100% or 0% (Flexible Pool)`,
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async validateKnowledgeLayer(
    configId: string,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    const sections =
      await this.examSectionRepository.findManyByConfigId(configId);
    if (sections.length === 0) {
      errors.push("Cannot validate knowledge layer without sections");
      return { valid: false, errors };
    }

    const sectionIds = sections.map((s) => s.id);

    // Batch fetch all mappings and their topics + active concepts in ONE query
    const [allMappings, weightageSums] = await Promise.all([
      this.prisma.sectionTopic.findMany({
        where: { sectionId: { in: sectionIds } },
        include: {
          topic: {
            include: {
              concepts: {
                where: { status: "ACTIVE" },
              },
            },
          },
        },
      }),
      this.prisma.topicWeightage.groupBy({
        by: ["sectionId"],
        where: { sectionId: { in: sectionIds } },
        _sum: { weightagePercentage: true },
      }),
    ]);

    const mappingsBySection = new Map<string, typeof allMappings>();
    for (const m of allMappings) {
      const list = mappingsBySection.get(m.sectionId) || [];
      list.push(m);
      mappingsBySection.set(m.sectionId, list);
    }

    const weightageMap = new Map<string, number>();
    for (const w of weightageSums) {
      weightageMap.set(w.sectionId, w._sum.weightagePercentage || 0);
    }

    for (const section of sections) {
      // 1. Topics Assigned
      const mappings = mappingsBySection.get(section.id) || [];
      if (mappings.length === 0) {
        errors.push(`Section '${section.name}' has no topics assigned`);
        continue;
      }

      // 2. Concepts Exist
      for (const mapping of mappings) {
        const topic = mapping.topic;
        const concepts = topic?.concepts || [];
        if (concepts.length === 0) {
          errors.push(
            `Topic '${topic?.name || mapping.topicId}' has no active concepts`,
          );
        }
      }

      // 3. Weightages Valid
      const weightageSum = weightageMap.get(section.id) || 0;
      if (weightageSum !== 100) {
        errors.push(
          `Section '${section.name}' topic weightages total is ${weightageSum}%, must be exactly 100%`,
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async validateTemplateLayer(
    configId: string,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    const sections =
      await this.examSectionRepository.findManyByConfigId(configId);
    if (sections.length === 0) {
      errors.push("Cannot validate template layer without sections");
      return { valid: false, errors };
    }

    const sectionIds = sections.map((s) => s.id);
    const mappings = await this.prisma.sectionTopic.findMany({
      where: { sectionId: { in: sectionIds } },
      select: { topicId: true },
    });
    const uniqueTopicIds = Array.from(new Set(mappings.map((m) => m.topicId)));

    if (uniqueTopicIds.length === 0) {
      errors.push("No topics assigned to configuration sections");
      return { valid: false, errors };
    }

    const allConcepts = await this.prisma.concept.findMany({
      where: {
        topicId: { in: uniqueTopicIds },
        status: "ACTIVE",
      },
    });

    if (allConcepts.length === 0) {
      errors.push("No active concepts found for assigned topics");
      return { valid: false, errors };
    }

    // Batch pre-fetch manual question counts for all concepts
    const conceptIds = allConcepts.map((c) => c.id);
    const manualQuestionCounts = await this.prisma.question.groupBy({
      by: ["conceptId"],
      where: {
        status: "ACTIVE",
        conceptId: { in: conceptIds },
      },
      _count: { id: true },
    });
    const manualCountMap = new Map<string, number>();
    for (const item of manualQuestionCounts) {
      if (item.conceptId) {
        manualCountMap.set(item.conceptId, item._count.id);
      }
    }

    const assignedConceptCodes = new Set(allConcepts.map((c) => c.code));
    const activeTemplates =
      assignedConceptCodes.size > 0
        ? await this.prisma.template.findMany({
            where: {
              isActive: true,
              conceptKey: { in: Array.from(assignedConceptCodes) },
              deletedAt: null,
            },
            select: {
              id: true,
              name: true,
              conceptKey: true,
            },
          })
        : [];
    const activeTemplateIds = activeTemplates.map((t) => t.id);

    // Batch pre-fetch variables, rules, and solution templates only for relevant active templates
    const [allVariables, allRules, allSolTemplates] = await Promise.all([
      activeTemplateIds.length > 0
        ? this.prisma.templateVariable.findMany({
            where: { templateId: { in: activeTemplateIds } },
            select: {
              id: true,
              templateId: true,
              variableName: true,
              defaultValue: true,
              variableType: true,
            },
          })
        : [],
      activeTemplateIds.length > 0
        ? this.prisma.templateRule.findMany({
            where: { templateId: { in: activeTemplateIds } },
            select: {
              id: true,
              templateId: true,
              ruleType: true,
              ruleConfig: true,
            },
          })
        : [],
      activeTemplateIds.length > 0
        ? this.prisma.solutionTemplate.findMany({
            where: { templateId: { in: activeTemplateIds } },
            select: {
              id: true,
              templateId: true,
            },
          })
        : [],
    ]);

    const variablesByTemplate = new Map<string, typeof allVariables>();
    for (const v of allVariables) {
      const list = variablesByTemplate.get(v.templateId) || [];
      list.push(v);
      variablesByTemplate.set(v.templateId, list);
    }

    const rulesByTemplate = new Map<string, typeof allRules>();
    for (const r of allRules) {
      const list = rulesByTemplate.get(r.templateId) || [];
      list.push(r);
      rulesByTemplate.set(r.templateId, list);
    }

    const solTemplateByTemplate = new Map<string, (typeof allSolTemplates)[0]>();
    for (const s of allSolTemplates) {
      solTemplateByTemplate.set(s.templateId, s);
    }

    for (const concept of allConcepts) {
      const matchingTemplates = activeTemplates.filter(
        (t) => t.conceptKey === concept.code,
      );

      // 1. Templates or Manual Questions Exist
      const availableManualCount = manualCountMap.get(concept.id) || 0;

      if (matchingTemplates.length === 0 && availableManualCount === 0) {
        errors.push(
          `No active templates or manual questions found for Concept '${concept.name}' (${concept.code})`,
        );
        continue;
      }

      for (const template of matchingTemplates) {
        // 2. Variables Exist & Valid
        const variables = variablesByTemplate.get(template.id) || [];

        // Basic verification of variables integrity
        const varNames = variables.map((v) => v.variableName);
        const uniqueNames = new Set(varNames);
        if (uniqueNames.size !== varNames.length) {
          errors.push(
            `Template '${template.name}' has duplicate variable definitions`,
          );
        }

        for (const variable of variables) {
          if (
            variable.defaultValue !== null &&
            variable.defaultValue !== undefined
          ) {
            if (
              !this.checkDefaultValueType(
                variable.defaultValue,
                variable.variableType,
              )
            ) {
              errors.push(
                `Default value '${variable.defaultValue}' for variable '${variable.variableName}' in template '${template.name}' is incompatible with type ${variable.variableType}`,
              );
            }
          }
        }

        // 3. Rules Exist & Valid
        const rules = rulesByTemplate.get(template.id) || [];

        for (const rule of rules) {
          const ruleErrMsg = this.validateRuleConfigAndCompatibility(
            rule.ruleType,
            rule.ruleConfig,
            variables,
          );
          if (ruleErrMsg) {
            errors.push(
              `Template '${template.name}' has invalid rule config: ${ruleErrMsg}`,
            );
          }
        }

        // 4. Solution Templates Exist
        const solTemplate = solTemplateByTemplate.get(template.id);
        if (!solTemplate) {
          errors.push(
            `Template '${template.name}' has no solution template configured`,
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async validateBlueprintLayer(
    configId: string,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // 1. Blueprint Exists
    const blueprint = await this.blueprintRepository.findByConfigId(configId);
    if (!blueprint) {
      errors.push("No blueprint configured for this exam config");
      return { valid: false, errors };
    }

    // 2. Blueprint Valid (using BlueprintService validate)
    const bpValidation = await this.blueprintService.validate(blueprint.id);
    if (!bpValidation.valid) {
      errors.push(...bpValidation.errors);
    }

    // 3. Style Profile Assigned and Exists
    if (!blueprint.styleProfileId) {
      errors.push("Blueprint has no style profile assigned");
    } else {
      const styleProfile = await this.prisma.styleProfile.findUnique({
        where: { id: blueprint.styleProfileId },
      });
      if (!styleProfile) {
        errors.push(
          `Style profile with ID '${blueprint.styleProfileId}' assigned to the blueprint does not exist`,
        );
      } else if (!styleProfile.active) {
        errors.push(
          `Style profile '${styleProfile.name}' assigned to the blueprint is inactive`,
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async validateGenerationPrerequisites(configId: string) {
    const [configRes, knowledgeRes, templateRes, blueprintRes] =
      await Promise.all([
        this.validateConfig(configId),
        this.validateKnowledgeLayer(configId),
        this.validateTemplateLayer(configId),
        this.validateBlueprintLayer(configId),
      ]);

    const errors: string[] = [];
    errors.push(...configRes.errors);
    errors.push(...knowledgeRes.errors);
    errors.push(...templateRes.errors);
    errors.push(...blueprintRes.errors);

    // Calculate score based on components configured correctly
    // 4 major layers. Let's give each layer 25 points if valid.
    let score = 0;
    if (configRes.valid) score += 25;
    if (knowledgeRes.valid) score += 25;
    if (templateRes.valid) score += 25;
    if (blueprintRes.valid) score += 25;

    return {
      valid: errors.length === 0,
      score,
      errors,
      breakdown: {
        configuration: {
          status: configRes.valid ? "PASS" : "FAIL",
          errors: configRes.errors,
        },
        knowledge: {
          status: knowledgeRes.valid ? "PASS" : "FAIL",
          errors: knowledgeRes.errors,
        },
        templates: {
          status: templateRes.valid ? "PASS" : "FAIL",
          errors: templateRes.errors,
        },
        blueprint: {
          status: blueprintRes.valid ? "PASS" : "FAIL",
          errors: blueprintRes.errors,
        },
      },
    };
  }
}
