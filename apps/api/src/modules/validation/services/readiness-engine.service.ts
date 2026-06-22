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
import { ReadinessReportRepository } from "../repositories/readiness-report.repository";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class ReadinessEngineService {
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
    private readonly readinessReportRepository: ReadinessReportRepository,
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
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    config: any,
    variables: TemplateVariable[],
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

  async evaluateConfig(configId: string) {
    const checks: Array<{
      name: string;
      status: "PASS" | "FAIL" | "WARNING";
      message?: string;
    }> = [];
    const reportData = {
      layerBreakdown: {
        configuration: "FAIL",
        knowledge: "FAIL",
        templates: "FAIL",
        blueprint: "FAIL",
      },
      fixes: [] as Array<{
        type: string;
        message: string;
        link?: string;
        tab?: string;
      }>,
    };

    // --- LAYER 1: CONFIG LAYER ---
    // 1. Config Exists
    const config = await this.examConfigRepository.findById(configId);
    if (
      !config ||
      config.isArchived ||
      config.status === ConfigStatus.ARCHIVED
    ) {
      checks.push({
        name: "Exam Config Exists",
        status: "FAIL",
        message: `Exam configuration with ID ${configId} not found or is archived`,
      });
      reportData.fixes.push({
        type: "config",
        message: "Exam configuration does not exist or has been archived",
        link: "/admin/configs",
      });

      const score = 0;
      const status = "NOT_READY";
      return { score, status, checks, report: reportData };
    }
    checks.push({
      name: "Exam Config Exists",
      status: "PASS",
    });

    // 2. Sections Configured
    const sections =
      await this.examSectionRepository.findManyByConfigId(configId);
    if (sections.length === 0) {
      checks.push({
        name: "Sections Configured",
        status: "FAIL",
        message: "No sections have been configured for this exam config",
      });
      reportData.fixes.push({
        type: "sections",
        message: "No sections configured. Please add at least one section.",
        tab: "sections",
      });
    } else {
      checks.push({
        name: "Sections Configured",
        status: "PASS",
      });
      const totalSectionQuestions = sections.reduce(
        (sum, s) => sum + s.questionCount,
        0,
      );
      if (totalSectionQuestions !== config.totalQuestions) {
        reportData.fixes.push({
          type: "sections_mismatch",
          message: `Total section questions (${totalSectionQuestions}) does not match exam configuration questions (${config.totalQuestions})`,
          tab: "sections",
        });
      }
    }

    const configLayerPassed = checks.every((c) => c.status === "PASS");
    reportData.layerBreakdown.configuration = configLayerPassed
      ? "PASS"
      : "FAIL";

    // --- LAYER 2: KNOWLEDGE LAYER ---
    // 3. Topics Assigned
    let topicsAssignedPass = true;
    const sectionTopicMappings = [];
    if (sections.length > 0) {
      for (const section of sections) {
        const mappings =
          await this.topicSectionMappingRepository.findMappingsBySection(
            section.id,
          );
        if (mappings.length === 0) {
          topicsAssignedPass = false;
          checks.push({
            name: "Topics Assigned",
            status: "FAIL",
            message: `Section '${section.name}' has no topics assigned`,
          });
          reportData.fixes.push({
            type: "topics",
            message: `${section.name} Section has no Topics`,
            tab: "sections",
          });
        }
        sectionTopicMappings.push(...mappings);
      }
    } else {
      topicsAssignedPass = false;
    }

    if (topicsAssignedPass && sections.length > 0) {
      checks.push({
        name: "Topics Assigned",
        status: "PASS",
      });
    } else if (sections.length > 0 && topicsAssignedPass === false) {
      // Handled
    } else {
      checks.push({
        name: "Topics Assigned",
        status: "FAIL",
        message: "Cannot check topic assignments without configured sections",
      });
    }

    // 4. Concepts Present
    let conceptsPresentPass = true;
    const uniqueTopicIds = Array.from(
      new Set(sectionTopicMappings.map((m) => m.topicId)),
    );
    const allAssignedConcepts = [];

    if (uniqueTopicIds.length > 0) {
      for (const topicId of uniqueTopicIds) {
        const topic = await this.topicRepository.findById(topicId);
        const concepts = await this.conceptMappingRepository.findManyByTopicId(
          topicId,
          true,
        );
        if (concepts.length === 0) {
          conceptsPresentPass = false;
          checks.push({
            name: "Concepts Present",
            status: "FAIL",
            message: `Topic '${topic?.name || topicId}' has no active concepts`,
          });
          reportData.fixes.push({
            type: "concepts",
            message: `Topic '${topic?.name || topicId}' has no Concepts`,
            link: "/admin/topics",
          });
        }
        allAssignedConcepts.push(...concepts);
      }
    } else {
      conceptsPresentPass = false;
    }

    if (conceptsPresentPass && uniqueTopicIds.length > 0) {
      checks.push({
        name: "Concepts Present",
        status: "PASS",
      });
    } else if (uniqueTopicIds.length > 0 && conceptsPresentPass === false) {
      // Handled
    } else {
      checks.push({
        name: "Concepts Present",
        status: "FAIL",
        message: "No concepts check can be run without assigned topics",
      });
    }

    // 5. Weightages Valid
    let weightagesValidPass = true;
    if (sections.length > 0 && topicsAssignedPass) {
      for (const section of sections) {
        const sum = await this.topicWeightageRepository.sumWeightagesBySection(
          section.id,
        );
        if (sum !== 100) {
          weightagesValidPass = false;
          checks.push({
            name: "Weightages Valid",
            status: "FAIL",
            message: `Section '${section.name}' topic weightages total is ${sum}%, must be exactly 100%`,
          });
          reportData.fixes.push({
            type: "weightages",
            message: `${section.name} Section weightages total is ${sum}%, must be exactly 100%`,
            tab: "sections",
          });
        }
      }
    } else {
      weightagesValidPass = false;
    }

    if (weightagesValidPass && sections.length > 0 && topicsAssignedPass) {
      checks.push({
        name: "Weightages Valid",
        status: "PASS",
      });
    } else if (
      sections.length > 0 &&
      topicsAssignedPass &&
      weightagesValidPass === false
    ) {
      // Handled
    } else {
      checks.push({
        name: "Weightages Valid",
        status: "FAIL",
        message: "Cannot validate weights without sections and topics mapped",
      });
    }

    const knowledgeLayerPassed =
      topicsAssignedPass && conceptsPresentPass && weightagesValidPass;
    reportData.layerBreakdown.knowledge = knowledgeLayerPassed
      ? "PASS"
      : "FAIL";

    // --- LAYER 3: TEMPLATE LAYER ---
    // 6. Templates Present
    let templatesPresentPass = true;
    const templateIdsToCheck = new Set<string>();

    if (allAssignedConcepts.length > 0) {
      for (const concept of allAssignedConcepts) {
        const templates = await this.templateRepository.findAll();
        const matchingTemplates = templates.filter(
          (t) => t.isActive && t.conceptKey === concept.code,
        );

        if (matchingTemplates.length === 0) {
          templatesPresentPass = false;
          checks.push({
            name: "Templates Present",
            status: "FAIL",
            message: `No active templates found for Concept '${concept.name}' (${concept.code})`,
          });
          reportData.fixes.push({
            type: "templates",
            message: `No active templates found for Concept '${concept.name}'`,
            link: "/admin/topics",
          });
        } else {
          matchingTemplates.forEach((t) => templateIdsToCheck.add(t.id));
        }
      }
    } else {
      templatesPresentPass = false;
    }

    if (templatesPresentPass && allAssignedConcepts.length > 0) {
      checks.push({
        name: "Templates Present",
        status: "PASS",
      });
    } else if (
      allAssignedConcepts.length > 0 &&
      templatesPresentPass === false
    ) {
      // Handled
    } else {
      checks.push({
        name: "Templates Present",
        status: "FAIL",
        message: "Cannot validate templates without assigned concepts",
      });
    }

    // 7. Variables Valid
    let variablesValidPass = true;
    const templateIdsArray = Array.from(templateIdsToCheck);

    if (templateIdsArray.length > 0) {
      for (const templateId of templateIdsArray) {
        const variables = await this.templateVariableRepository.findAll({
          templateId,
        });
        const template = await this.templateRepository.findById(templateId);

        const varNames = variables.map((v) => v.variableName);
        const uniqueNames = new Set(varNames);
        if (uniqueNames.size !== varNames.length) {
          variablesValidPass = false;
          checks.push({
            name: "Variables Valid",
            status: "FAIL",
            message: `Template '${template?.name || templateId}' has duplicate variable definitions`,
          });
          reportData.fixes.push({
            type: "variables",
            message: `Template '${template?.name || templateId}' has duplicate variables`,
            link: "/admin/topics",
          });
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
              variablesValidPass = false;
              checks.push({
                name: "Variables Valid",
                status: "FAIL",
                message: `Default value '${variable.defaultValue}' for variable '${variable.variableName}' in template '${template?.name || templateId}' is incompatible with type ${variable.variableType}`,
              });
              reportData.fixes.push({
                type: "variables",
                message: `Default value mismatch in template '${template?.name || templateId}'`,
                link: "/admin/topics",
              });
            }
          }
        }
      }
    } else {
      variablesValidPass = false;
    }

    if (variablesValidPass && templateIdsArray.length > 0) {
      checks.push({
        name: "Variables Valid",
        status: "PASS",
      });
    } else if (templateIdsArray.length > 0 && variablesValidPass === false) {
      // Handled
    } else {
      checks.push({
        name: "Variables Valid",
        status: "FAIL",
        message: "No templates variables checked",
      });
    }

    // 8. Rules Valid
    let rulesValidPass = true;
    if (templateIdsArray.length > 0) {
      for (const templateId of templateIdsArray) {
        const rules = await this.templateRuleRepository.findAll({ templateId });
        const variables = await this.templateVariableRepository.findAll({
          templateId,
        });
        const template = await this.templateRepository.findById(templateId);

        for (const rule of rules) {
          const errMsg = this.validateRuleConfigAndCompatibility(
            rule.ruleType,
            rule.ruleConfig,
            variables,
          );
          if (errMsg) {
            rulesValidPass = false;
            checks.push({
              name: "Rules Valid",
              status: "FAIL",
              message: `Template '${template?.name || templateId}' has invalid rule config: ${errMsg}`,
            });
            reportData.fixes.push({
              type: "rules",
              message: `Rule configuration error in template '${template?.name || templateId}'`,
              link: "/admin/topics",
            });
          }
        }
      }
    } else {
      rulesValidPass = false;
    }

    if (rulesValidPass && templateIdsArray.length > 0) {
      checks.push({
        name: "Rules Valid",
        status: "PASS",
      });
    } else if (templateIdsArray.length > 0 && rulesValidPass === false) {
      // Handled
    } else {
      checks.push({
        name: "Rules Valid",
        status: "FAIL",
        message: "No templates rules checked",
      });
    }

    const templateLayerPassed =
      templatesPresentPass && variablesValidPass && rulesValidPass;
    reportData.layerBreakdown.templates = templateLayerPassed ? "PASS" : "FAIL";

    // --- LAYER 4: BLUEPRINT LAYER ---
    // 9. Blueprint Exists
    const blueprint = await this.blueprintRepository.findByConfigId(configId);
    if (!blueprint) {
      checks.push({
        name: "Blueprint Exists",
        status: "FAIL",
        message: "No blueprint configured for this exam config",
      });
      reportData.fixes.push({
        type: "blueprint_missing",
        message: "Coding Blueprint Invalid", // Matches exact actionable fix text
        link: `/admin/blueprints/new`,
      });
      checks.push({
        name: "Blueprint Valid",
        status: "FAIL",
        message: "Cannot validate a non-existent blueprint",
      });
      reportData.layerBreakdown.blueprint = "FAIL";
    } else {
      checks.push({
        name: "Blueprint Exists",
        status: "PASS",
      });

      // 10. Blueprint Valid
      try {
        const bpValidation = await this.blueprintService.validate(blueprint.id);
        if (!bpValidation.valid) {
          checks.push({
            name: "Blueprint Valid",
            status: "FAIL",
            message: bpValidation.errors.join("; "),
          });
          bpValidation.errors.forEach((err) => {
            let type = "blueprint_invalid";
            if (err.includes("difficulty level") || err.includes("templates")) {
              type = "hard_templates_missing";
            }
            reportData.fixes.push({
              type,
              message: err,
              link: `/admin/blueprints/${blueprint.id}/edit`,
            });
          });
          reportData.layerBreakdown.blueprint = "FAIL";
        } else {
          checks.push({
            name: "Blueprint Valid",
            status: "PASS",
          });
          reportData.layerBreakdown.blueprint = "PASS";
        }
      } catch (err: unknown) {
        const error = err as Error;
        checks.push({
          name: "Blueprint Valid",
          status: "FAIL",
          message: error.message || "Error validating blueprint",
        });
        reportData.layerBreakdown.blueprint = "FAIL";
      }
    }

    const score = this.calculateScore(checks);
    const status = this.getReadinessStatus(score);

    return { score, status, checks, report: reportData };
  }

  calculateScore(
    checks: Array<{ status: "PASS" | "FAIL" | "WARNING" }>,
  ): number {
    const passingChecksCount = checks.filter((c) => c.status === "PASS").length;
    return passingChecksCount * 10;
  }

  getReadinessStatus(score: number): "NOT_READY" | "PARTIALLY_READY" | "READY" {
    if (score === 100) return "READY";
    if (score >= 50) return "PARTIALLY_READY";
    return "NOT_READY";
  }

  async generateReport(configId: string) {
    const evaluation = await this.evaluateConfig(configId);
    const existing =
      await this.readinessReportRepository.findLatestByConfigId(configId);

    if (existing) {
      return this.readinessReportRepository.update(existing.id, {
        score: evaluation.score,
        status: evaluation.status,
        report: {
          checks: evaluation.checks,
          report: evaluation.report,
        },
      });
    }

    return this.readinessReportRepository.create({
      examConfig: { connect: { id: configId } },
      score: evaluation.score,
      status: evaluation.status,
      report: {
        checks: evaluation.checks,
        report: evaluation.report,
      },
    });
  }

  async getLatestReport(configId: string) {
    const report =
      await this.readinessReportRepository.findLatestByConfigId(configId);
    if (!report) {
      return this.generateReport(configId);
    }
    return report;
  }
}
