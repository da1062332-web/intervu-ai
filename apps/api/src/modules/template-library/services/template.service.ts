import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import {
  Template,
  Prisma,
  DifficultyLevel,
  TemplateVariable,
  TemplateRule,
  VariableType,
  RuleType,
  GenerationStrategy,
} from "@prisma/client";
import { createHash } from "crypto";
import * as math from "mathjs";
import {
  PRNG,
  generateVariables,
  evaluateConstraints,
  hydrateString,
  generateDistractors,
  evaluateExpression,
  roundToPrecision,
} from "@intervu-ai/generation";
import { parseOptionsTemplate } from "../../generation/services/question-instantiator.service";
import {
  analyzeMathjsExpression,
  getUnsupportedMathjsFunctions,
} from "./expression-utils";
import {
  TemplateGenerationException,
  VariableGenerationError,
  ConstraintValidationError,
  FormulaEvaluationError,
  DistractorGenerationError,
} from "../../../core/exceptions";

import { RedisCacheService } from "../../../cache";
import { TemplateRepository } from "../repositories/template.repository";
import { TemplateVariableRepository } from "../repositories/template-variable.repository";
import { TemplateRuleRepository } from "../repositories/template-rule.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import { AppLogger } from "@intervu-ai/shared-logger";
import { StrategyCanonicalizationService } from "./strategy-canonicalization.service";
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateVersionDto,
  CreateTemplateVariableDto,
  UpdateTemplateVariableDto,
  CreateTemplateRuleDto,
  UpdateTemplateRuleDto,
} from "@intervu/shared";

interface RuleConfig {
  variableName?: string;
  difficulty?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface PaginatedTemplates {
  items: Template[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class TemplateService {
  private readonly logger = new AppLogger({ name: "TemplateService" });

  constructor(
    private readonly prisma: PrismaService,
    private readonly templateRepository: TemplateRepository,
    private readonly templateVariableRepository: TemplateVariableRepository,
    private readonly templateRuleRepository: TemplateRuleRepository,
    private readonly cacheService: RedisCacheService,
    private readonly canonicalizationService: StrategyCanonicalizationService,
  ) {}

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async findAll(
    page = 1,
    limit = 10,
    difficulty?: DifficultyLevel,
    strategy?: GenerationStrategy,
    conceptKey?: string,
  ): Promise<PaginatedTemplates> {
    // 1. validate()
    if (page < 1 || limit < 1 || limit > 1000) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "page must be ≥ 1 and limit must be between 1 and 1000",
        },
      });
    }

    // 2. fetchDependencies() — check cache first
    const filterHash = createHash("md5")
      .update(
        `p${page}l${limit}d${difficulty ?? "all"}s${strategy ?? "all"}c${conceptKey ?? "all"}`,
      )
      .digest("hex");
    const cached =
      await this.cacheService.getTemplateList<PaginatedTemplates>(filterHash);
    if (cached) return cached;

    // 3. coreLogic() — fetch from DB
    const whereClause: Record<string, unknown> = {};
    if (difficulty) whereClause.difficultyLevel = difficulty;
    if (strategy) whereClause.generationStrategy = strategy;
    if (conceptKey) {
      whereClause.conceptKey = {
        equals: conceptKey,
        mode: "insensitive",
      };
    }

    const result = await this.templateRepository.findPaginated(
      { page, limit },
      whereClause,
      { createdAt: "desc" },
    );

    // 4. formatResponse() — cache and return
    await this.cacheService.setTemplateList(filterHash, result);
    return result;
  }

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async findById(id: string): Promise<Template> {
    // 1. validate()
    if (!id || id.trim().length === 0) {
      throw new BadRequestException({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Template ID is required" },
      });
    }

    // 2. fetchDependencies() — check cache first
    const cached = await this.cacheService.getTemplate<Template>(id);
    if (cached) return cached;

    // 3. coreLogic() — fetch from DB
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new NotFoundException({
        success: false,
        error: { code: "NOT_FOUND", message: `Template ${id} not found` },
      });
    }

    // 4. formatResponse() — cache and return
    await this.cacheService.setTemplate(id, template);
    return template;
  }

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async findByDifficulty(difficulty: DifficultyLevel): Promise<Template[]> {
    // 1. validate()
    if (!DifficultyLevel[difficulty]) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `Invalid difficulty: ${difficulty}`,
        },
      });
    }

    // 2. fetchDependencies() — check cache
    const cached =
      await this.cacheService.getTemplatesByDifficulty<Template[]>(difficulty);
    if (cached) return cached;

    // 3. coreLogic() — fetch from DB
    const templates =
      await this.templateRepository.findByDifficulty(difficulty);

    // 4. formatResponse() — cache and return
    await this.cacheService.setTemplatesByDifficulty(difficulty, templates);
    return templates;
  }

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async findSystemTemplates(): Promise<Template[]> {
    // 1. validate() — no input

    // 2. fetchDependencies() — check cache
    const cached = await this.cacheService.getSystemTemplates<Template[]>();
    if (cached) return cached;

    // 3. coreLogic() — fetch from DB
    const templates = await this.templateRepository.findSystemTemplates();

    // 4. formatResponse() — cache with long TTL and return
    await this.cacheService.setSystemTemplates(templates);
    return templates;
  }

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async create(dto: CreateTemplateDto): Promise<Template> {
    // 1. validate()
    const validation = CreateTemplateDto.validate(dto);
    if (!validation.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid template data",
          details: validation.error.format(),
        },
      });
    }
    const validated = validation.data;

    // 2. fetchDependencies() — none required for create

    // 2.5. Validate strategy / solution definitions before persisting
    if (
      validated.variableSchema !== undefined ||
      validated.constraints !== undefined
    ) {
      const validationErrors = this.validateStrategyPayload(
        validated.variableSchema,
        validated.constraints,
      );
      if (validationErrors.length > 0) {
        const msg = validationErrors[0];
        if (msg.toLowerCase().includes("formula") || msg.toLowerCase().includes("expression")) {
          throw new FormulaEvaluationError("unknown", msg, "formulas");
        } else if (msg.toLowerCase().includes("constraint")) {
          throw new ConstraintValidationError("constraints", msg);
        } else {
          throw new VariableGenerationError("unknown", msg, "variables");
        }
      }
    }

    if (validated.solutionSchema !== undefined) {
      const solutionErrors = this.validateSolutionSchema(
        validated.solutionSchema,
        validated.variableSchema,
      );
      if (solutionErrors.length > 0) {
        throw new BadRequestException({
          success: false,
          error: {
            code: "INVALID_SOLUTION_SCHEMA",
            message:
              "Template solution schema contains invalid expression or invalid variable references.",
            details: solutionErrors,
          },
        });
      }
    }

    // 3. coreLogic() — persist to DB
    const createInput: Prisma.TemplateCreateInput = {
      name: validated.name,
      description: validated.description,
      difficulty:
        (validated.difficulty as DifficultyLevel) ?? DifficultyLevel.MEDIUM,
      difficultyLevel:
        (validated.difficulty as DifficultyLevel) ?? DifficultyLevel.MEDIUM,
      config: (validated.config as Prisma.InputJsonValue) ?? {},
      isSystem: validated.isSystem ?? false,
      ...(validated.templateKey && { templateKey: validated.templateKey }),
      ...(validated.conceptKey && { conceptKey: validated.conceptKey }),
      ...(validated.questionType && { questionType: validated.questionType }),
      ...(validated.structure && {
        structure: validated.structure as Prisma.InputJsonValue,
      }),
      ...(validated.variableSchema && {
        variableSchema: validated.variableSchema as Prisma.InputJsonValue,
      }),
      ...(validated.solutionSchema && {
        solutionSchema: validated.solutionSchema as Prisma.InputJsonValue,
      }),
      ...(validated.constraints && {
        constraints: validated.constraints as Prisma.InputJsonValue,
      }),
      ...(validated.generationStrategy && {
        generationStrategy: validated.generationStrategy,
      }),
    };
    const template = await this.templateRepository.create(createInput);

    // 4. formatResponse() — invalidate list caches, return new template
    if (template.isSystem) {
      await this.cacheService.invalidateSystemTemplates();
    } else {
      await this.cacheService.clear("template:list:*");
    }

    // Trigger incremental readiness check in the background
    this.generateQuestionForTemplate(template.id).catch(() => {
      // Errors are handled and update readinessStatus to ERROR
    });

    return template;
  }

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async update(id: string, dto: UpdateTemplateDto): Promise<Template> {
    // 1. validate()
    const validation = UpdateTemplateDto.validate(dto);
    if (!validation.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid update data",
          details: validation.error.format(),
        },
      });
    }
    const validated = validation.data;

    // 2. fetchDependencies() — ensure template exists
    const existing = await this.templateRepository.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: "NOT_FOUND", message: `Template ${id} not found` },
      });
    }

    // 3. coreLogic() — build update input and persist
    const updateInput: Prisma.TemplateUpdateInput = {};
    if (validated.name !== undefined) updateInput.name = validated.name;
    if (validated.description !== undefined)
      updateInput.description = validated.description;
    if (validated.difficulty !== undefined) {
      updateInput.difficulty = validated.difficulty as DifficultyLevel;
      updateInput.difficultyLevel = validated.difficulty as DifficultyLevel;
    }
    if (validated.config !== undefined)
      updateInput.config = validated.config as Prisma.InputJsonValue;
    const mode =
      (validated as any).datasetGenerationMode ||
      (validated.config as any)?.datasetGenerationMode;
    if (mode !== undefined) {
      const currentConfig = (existing.config as Record<string, any>) || {};
      const currentDatasetConfig =
        (existing.datasetConfig as Record<string, any>) || {};
      updateInput.config = {
        ...currentConfig,
        ...((updateInput.config as Record<string, any>) || {}),
        datasetGenerationMode: mode,
      } as Prisma.InputJsonValue;
      updateInput.datasetConfig = {
        ...currentDatasetConfig,
        datasetGenerationMode: mode,
      } as Prisma.InputJsonValue;
    }
    if (validated.templateKey !== undefined)
      updateInput.templateKey = validated.templateKey;
    if (validated.conceptKey !== undefined)
      updateInput.conceptKey = validated.conceptKey;
    if (validated.questionType !== undefined)
      updateInput.questionType = validated.questionType;
    if (validated.structure !== undefined)
      updateInput.structure = validated.structure as Prisma.InputJsonValue;
    if (validated.variableSchema !== undefined)
      updateInput.variableSchema =
        validated.variableSchema as Prisma.InputJsonValue;
    if (validated.solutionSchema !== undefined)
      updateInput.solutionSchema =
        validated.solutionSchema as Prisma.InputJsonValue;
    if (validated.constraints !== undefined)
      updateInput.constraints = validated.constraints as Prisma.InputJsonValue;
    if (validated.generationStrategy !== undefined)
      updateInput.generationStrategy = validated.generationStrategy;

    if (
      validated.variableSchema !== undefined ||
      validated.constraints !== undefined
    ) {
      const validationErrors = this.validateStrategyPayload(
        validated.variableSchema,
        validated.constraints,
      );
      if (validationErrors.length > 0) {
        const msg = validationErrors[0];
        if (msg.toLowerCase().includes("formula") || msg.toLowerCase().includes("expression")) {
          throw new FormulaEvaluationError("unknown", msg, "formulas");
        } else if (msg.toLowerCase().includes("constraint")) {
          throw new ConstraintValidationError("constraints", msg);
        } else {
          throw new VariableGenerationError("unknown", msg, "variables");
        }
      }
    }

    if (
      validated.solutionSchema !== undefined ||
      validated.variableSchema !== undefined
    ) {
      const finalVariableSchema =
        validated.variableSchema !== undefined
          ? validated.variableSchema
          : existing.variableSchema;
      const finalSolutionSchema =
        validated.solutionSchema !== undefined
          ? validated.solutionSchema
          : existing.solutionSchema;

      const solutionErrors = this.validateSolutionSchema(
        finalSolutionSchema,
        finalVariableSchema,
      );
      if (solutionErrors.length > 0) {
        throw new FormulaEvaluationError(
          "unknown",
          solutionErrors[0],
          "solutionSchema",
        );
      }
    }

    // Validate optionsTemplate if updated
    const finalStructure: any = validated.structure !== undefined ? validated.structure : existing.structure;
    if (finalStructure && finalStructure.optionsTemplate) {
      try {
        parseOptionsTemplate(finalStructure.optionsTemplate);
      } catch (e: any) {
        throw new DistractorGenerationError(
          "unknown",
          e.message || "Invalid option strategy definition",
          "optionsTemplate"
        );
      }
    }
    if ((validated as any).isActive !== undefined)
      updateInput.isActive = (validated as any).isActive;

    const updated = await this.templateRepository.update(id, updateInput);

    // 4. formatResponse() — invalidate stale caches, return updated template
    await this.cacheService.invalidateTemplate(id);
    if (updated.isSystem) {
      await this.cacheService.invalidateSystemTemplates();
    } else {
      await this.cacheService.clear("template:list:*");
    }

    // Trigger incremental readiness check in the background
    this.generateQuestionForTemplate(id).catch(() => {
      // Errors are already logged in generateQuestionForTemplate and
      // the template readinessStatus will be updated to ERROR.
    });

    return updated;
  }

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async remove(id: string): Promise<{ id: string }> {
    // 1. validate()
    if (!id || id.trim().length === 0) {
      throw new BadRequestException({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Template ID is required" },
      });
    }

    // 2. fetchDependencies() — ensure template exists
    const existing = await this.templateRepository.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: "NOT_FOUND", message: `Template ${id} not found` },
      });
    }

    // 3. coreLogic() — soft delete
    await this.templateRepository.delete(id);

    // 4. formatResponse() — invalidate all template caches
    await this.cacheService.invalidateTemplate(id);
    if (existing.isSystem) {
      await this.cacheService.invalidateSystemTemplates();
    }
    return { id };
  }

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async getVersion(id: string): Promise<TemplateVersionDto> {
    // 1. validate()
    if (!id || id.trim().length === 0) {
      throw new BadRequestException({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Template ID is required" },
      });
    }

    // 2. fetchDependencies() — reuse findById (cache-aware)
    const template = await this.findById(id);

    // 3. coreLogic() — use updatedAt as optimistic version token

    // 4. formatResponse()
    return {
      id: template.id,
      version: template.updatedAt.toISOString(),
      name: template.name,
    };
  }

  // Variables CRUD
  async getVariables(templateId: string): Promise<TemplateVariable[]> {
    return this.templateVariableRepository.findAll({ templateId });
  }

  async createVariable(
    templateId: string,
    dto: CreateTemplateVariableDto,
  ): Promise<TemplateVariable> {
    const startTime = Date.now();
    return this.prisma.$transaction(
      async (tx) => {
        const templateRepo = this.templateRepository.withTransaction(tx);
        const variableRepo =
          this.templateVariableRepository.withTransaction(tx);

        // Validate template exists
        const template = await templateRepo.findById(templateId);
        if (!template) {
          throw new NotFoundException(`Template ${templateId} not found`);
        }

        // Validate uniqueness of variable name
        const existing = await variableRepo.findAll({
          templateId,
          variableName: dto.variableName,
        });
        if (existing.length > 0) {
          throw new BadRequestException(
            `Variable with name '${dto.variableName}' already exists in this template`,
          );
        }

        // Validate default value matches type
        if (dto.defaultValue !== null && dto.defaultValue !== undefined) {
          if (!this.checkDefaultValueType(dto.defaultValue, dto.variableType)) {
            throw new BadRequestException(
              `Default value '${dto.defaultValue}' is not compatible with type ${dto.variableType}`,
            );
          }
        }

        const variable = await variableRepo.create({
          template: { connect: { id: templateId } },
          variableName: dto.variableName,
          variableType: dto.variableType as VariableType,
          required: dto.required ?? false,
          defaultValue: dto.defaultValue,
        });

        const duration = Date.now() - startTime;
        this.logger.info(`Variable created: ${variable.id}`, {
          templateId,
          operation: "create_variable",
          variableId: variable.id,
          validationDuration: duration,
          timestamp: new Date().toISOString(),
        });

        return variable;
      },
      {
        maxWait: 15000,
        timeout: 30000,
      },
    );
  }

  async updateVariable(
    id: string,
    dto: UpdateTemplateVariableDto,
  ): Promise<TemplateVariable> {
    const startTime = Date.now();
    return this.prisma.$transaction(
      async (tx) => {
        const variableRepo =
          this.templateVariableRepository.withTransaction(tx);

        const existingVar = await variableRepo.findById(id);
        if (!existingVar) {
          throw new NotFoundException(`Variable ${id} not found`);
        }

        // Validate uniqueness if name changed
        if (dto.variableName && dto.variableName !== existingVar.variableName) {
          const dup = await variableRepo.findAll({
            templateId: existingVar.templateId,
            variableName: dto.variableName,
          });
          if (dup.length > 0) {
            throw new BadRequestException(
              `Variable with name '${dto.variableName}' already exists in this template`,
            );
          }
        }

        const newType = dto.variableType ?? existingVar.variableType;
        const newDefaultValue =
          dto.defaultValue !== undefined
            ? dto.defaultValue
            : existingVar.defaultValue;

        // Validate default value if default or type changed
        if (newDefaultValue !== null && newDefaultValue !== undefined) {
          if (!this.checkDefaultValueType(newDefaultValue, newType)) {
            throw new BadRequestException(
              `Default value '${newDefaultValue}' is not compatible with type ${newType}`,
            );
          }
        }

        const updated = await variableRepo.update(id, {
          variableName: dto.variableName,
          variableType: dto.variableType as VariableType,
          required: dto.required,
          defaultValue: dto.defaultValue,
        });

        const duration = Date.now() - startTime;
        this.logger.info(`Variable updated: ${id}`, {
          templateId: existingVar.templateId,
          operation: "update_variable",
          variableId: id,
          validationDuration: duration,
          timestamp: new Date().toISOString(),
        });

        return updated;
      },
      {
        maxWait: 15000,
        timeout: 30000,
      },
    );
  }

  async deleteVariable(id: string): Promise<{ id: string }> {
    const startTime = Date.now();
    return this.prisma.$transaction(
      async (tx) => {
        const variableRepo =
          this.templateVariableRepository.withTransaction(tx);
        const ruleRepo = this.templateRuleRepository.withTransaction(tx);

        const existingVar = await variableRepo.findById(id);
        if (!existingVar) {
          throw new NotFoundException(`Variable ${id} not found`);
        }

        // Rule Cleanup Strategy: Find dependent rules (where ruleConfig.variableName matches variableName)
        const allRules = await ruleRepo.findAll({
          templateId: existingVar.templateId,
        });
        const dependentRules = allRules.filter((rule) => {
          const config = rule.ruleConfig as unknown as RuleConfig;
          return config && config.variableName === existingVar.variableName;
        });

        // Cascade delete dependent rules
        for (const rule of dependentRules) {
          await ruleRepo.delete(rule.id);
          this.logger.info(`Cascade deleted dependent rule: ${rule.id}`, {
            templateId: existingVar.templateId,
            operation: "cascade_delete_rule",
            ruleId: rule.id,
            timestamp: new Date().toISOString(),
          });
        }

        await variableRepo.delete(id);

        const duration = Date.now() - startTime;
        this.logger.info(`Variable deleted: ${id}`, {
          templateId: existingVar.templateId,
          operation: "delete_variable",
          variableId: id,
          validationDuration: duration,
          timestamp: new Date().toISOString(),
        });

        return { id };
      },
      {
        maxWait: 15000,
        timeout: 30000,
      },
    );
  }

  // Rules CRUD
  async getRules(templateId: string): Promise<TemplateRule[]> {
    return this.templateRuleRepository.findAll({ templateId });
  }

  async createRule(
    templateId: string,
    dto: CreateTemplateRuleDto,
  ): Promise<TemplateRule> {
    const startTime = Date.now();
    return this.prisma.$transaction(
      async (tx) => {
        const templateRepo = this.templateRepository.withTransaction(tx);
        const ruleRepo = this.templateRuleRepository.withTransaction(tx);
        const variableRepo =
          this.templateVariableRepository.withTransaction(tx);

        // Validate template exists
        const template = await templateRepo.findById(templateId);
        if (!template) {
          throw new NotFoundException(`Template ${templateId} not found`);
        }

        // Check rule configuration & compatibility matrix
        const variables = await variableRepo.findAll({ templateId });
        this.validateRuleConfigAndCompatibility(
          dto.ruleType,
          dto.ruleConfig,
          variables,
        );

        const rule = await ruleRepo.create({
          template: { connect: { id: templateId } },
          ruleType: dto.ruleType as RuleType,
          ruleConfig: dto.ruleConfig as Prisma.InputJsonValue,
        });

        const duration = Date.now() - startTime;
        this.logger.info(`Rule created: ${rule.id}`, {
          templateId,
          operation: "create_rule",
          ruleId: rule.id,
          validationDuration: duration,
          timestamp: new Date().toISOString(),
        });

        return rule;
      },
      {
        maxWait: 15000,
        timeout: 30000,
      },
    );
  }

  async updateRule(
    id: string,
    dto: UpdateTemplateRuleDto,
  ): Promise<TemplateRule> {
    const startTime = Date.now();
    return this.prisma.$transaction(
      async (tx) => {
        const ruleRepo = this.templateRuleRepository.withTransaction(tx);
        const variableRepo =
          this.templateVariableRepository.withTransaction(tx);

        const existingRule = await ruleRepo.findById(id);
        if (!existingRule) {
          throw new NotFoundException(`Rule ${id} not found`);
        }

        const finalType = dto.ruleType ?? existingRule.ruleType;
        const finalConfig = (dto.ruleConfig ??
          existingRule.ruleConfig) as unknown as RuleConfig;

        // Validate configuration & compatibility
        const variables = await variableRepo.findAll({
          templateId: existingRule.templateId,
        });
        this.validateRuleConfigAndCompatibility(
          finalType,
          finalConfig,
          variables,
        );

        const updated = await ruleRepo.update(id, {
          ruleType: dto.ruleType as RuleType,
          ruleConfig: dto.ruleConfig as Prisma.InputJsonValue,
        });

        const duration = Date.now() - startTime;
        this.logger.info(`Rule updated: ${id}`, {
          templateId: existingRule.templateId,
          operation: "update_rule",
          ruleId: id,
          validationDuration: duration,
          timestamp: new Date().toISOString(),
        });

        return updated;
      },
      {
        maxWait: 15000,
        timeout: 30000,
      },
    );
  }

  async deleteRule(id: string): Promise<{ id: string }> {
    const startTime = Date.now();
    return this.prisma.$transaction(
      async (tx) => {
        const ruleRepo = this.templateRuleRepository.withTransaction(tx);

        const existingRule = await ruleRepo.findById(id);
        if (!existingRule) {
          throw new NotFoundException(`Rule ${id} not found`);
        }

        await ruleRepo.delete(id);

        const duration = Date.now() - startTime;
        this.logger.info(`Rule deleted: ${id}`, {
          templateId: existingRule.templateId,
          operation: "delete_rule",
          ruleId: id,
          validationDuration: duration,
          timestamp: new Date().toISOString(),
        });

        return { id };
      },
      {
        maxWait: 15000,
        timeout: 30000,
      },
    );
  }

  private validateRuleConfigAndCompatibility(
    ruleType: string,
    config: RuleConfig,
    variables: TemplateVariable[],
  ) {
    if (ruleType === "DIFFICULTY") {
      if (
        !config ||
        !config.difficulty ||
        !["EASY", "MEDIUM", "HARD", "easy", "medium", "hard"].includes(
          config.difficulty,
        )
      ) {
        throw new BadRequestException(
          "Difficulty rule config must specify difficulty as 'easy', 'medium' or 'hard'",
        );
      }
      return;
    }

    if (!config || typeof config.variableName !== "string") {
      throw new BadRequestException(
        "Rule configuration must specify a variableName",
      );
    }

    const targetVar = variables.find(
      (v) => v.variableName === config.variableName,
    );
    if (!targetVar) {
      throw new BadRequestException(
        `Rule targets non-existent variable '${config.variableName}'`,
      );
    }

    // Enforce Rule Compatibility Matrix
    if (ruleType === "RANGE") {
      if (targetVar.variableType !== "NUMBER") {
        throw new BadRequestException(
          `Range rule cannot be applied to variable '${targetVar.variableName}' of type ${targetVar.variableType}`,
        );
      }
      if (typeof config.min !== "number" || typeof config.max !== "number") {
        throw new BadRequestException(
          "Range rule config must specify numeric min and max",
        );
      }
      if (config.min > config.max) {
        throw new BadRequestException(
          `Range min ${config.min} cannot be greater than max ${config.max}`,
        );
      }
    } else if (ruleType === "LENGTH") {
      if (
        targetVar.variableType !== "STRING" &&
        targetVar.variableType !== "ARRAY" &&
        targetVar.variableType !== "CODE"
      ) {
        throw new BadRequestException(
          `Length rule cannot be applied to variable '${targetVar.variableName}' of type ${targetVar.variableType}`,
        );
      }
      if (
        typeof config.minLength !== "number" ||
        typeof config.maxLength !== "number"
      ) {
        throw new BadRequestException(
          "Length rule config must specify integer minLength and maxLength",
        );
      }
      if (config.minLength > config.maxLength) {
        throw new BadRequestException(
          `Length minLength ${config.minLength} cannot be greater than maxLength ${config.maxLength}`,
        );
      }
    } else if (ruleType === "REGEX") {
      if (
        targetVar.variableType !== "STRING" &&
        targetVar.variableType !== "CODE"
      ) {
        throw new BadRequestException(
          `Regex rule cannot be applied to variable '${targetVar.variableName}' of type ${targetVar.variableType}`,
        );
      }
      if (typeof config.pattern !== "string") {
        throw new BadRequestException(
          "Regex rule config must specify pattern string",
        );
      }
      try {
        new RegExp(config.pattern);
      } catch {
        throw new BadRequestException(
          `Invalid regex pattern: ${config.pattern}`,
        );
      }
    }
  }

  // Template validation engine
  async validateTemplate(
    id: string,
    values: Record<string, unknown>,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const startTime = Date.now();
    this.logger.info(`Validation started for template: ${id}`, {
      templateId: id,
      operation: "validate_template_start",
      timestamp: new Date().toISOString(),
    });

    const errors: string[] = [];

    try {
      // 1. Fetch template
      const template = await this.templateRepository.findById(id);
      if (!template) {
        throw new NotFoundException(`Template ${id} not found`);
      }

      // 2. Fetch variables
      const variables = await this.templateVariableRepository.findAll({
        templateId: id,
      });

      // 3. Fetch rules
      const rules = await this.templateRuleRepository.findAll({
        templateId: id,
      });

      // 4. Detect duplicate variable names
      const varNames = variables.map((v) => v.variableName);
      const uniqueNames = new Set(varNames);
      if (uniqueNames.size !== varNames.length) {
        errors.push("Template has duplicate variable definitions");
      }

      // 5. Validate required variables
      for (const variable of variables) {
        if (variable.required) {
          if (!(variable.variableName in values)) {
            errors.push(`Variable '${variable.variableName}' is required`);
          }
        }
      }

      // 6. Validate variable types
      for (const variable of variables) {
        if (variable.variableName in values) {
          const val = values[variable.variableName];
          if (!this.checkType(val, variable.variableType)) {
            errors.push(
              `Variable '${variable.variableName}' must be of type ${variable.variableType}`,
            );
          }
        }
      }

      // 7. Validate default values
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
              `Default value '${variable.defaultValue}' for '${variable.variableName}' is not compatible with type ${variable.variableType}`,
            );
          }
        }
      }

      // 8. Validate rule configurations & 9. Cross-rule conflicts
      for (const rule of rules) {
        try {
          this.validateRuleConfigAndCompatibility(
            rule.ruleType,
            rule.ruleConfig as unknown as RuleConfig,
            variables,
          );
        } catch (ruleErr: unknown) {
          errors.push(
            ruleErr instanceof Error ? ruleErr.message : String(ruleErr),
          );
        }
      }

      // 10. Validate runtime values
      if (errors.length === 0) {
        for (const rule of rules) {
          const config = rule.ruleConfig as unknown as RuleConfig;
          if (rule.ruleType === "DIFFICULTY") {
            const diffVal = config.difficulty!.toUpperCase();
            if (template.difficulty !== diffVal) {
              errors.push(
                `Template difficulty does not match rule difficulty: expected ${diffVal}, got ${template.difficulty}`,
              );
            }
          } else if (rule.ruleType === "RANGE") {
            const val = values[config.variableName!];
            if (typeof val === "number") {
              if (val < config.min! || val > config.max!) {
                errors.push(
                  `Variable '${config.variableName!}' value ${val} is out of range [${config.min!}, ${config.max!}]`,
                );
              }
            }
          } else if (rule.ruleType === "LENGTH") {
            const val = values[config.variableName!];
            if (typeof val === "string" || Array.isArray(val)) {
              if (
                val.length < config.minLength! ||
                val.length > config.maxLength!
              ) {
                errors.push(
                  `Variable '${config.variableName!}' length ${val.length} is out of range [${config.minLength!}, ${config.maxLength!}]`,
                );
              }
            }
          } else if (rule.ruleType === "REGEX") {
            const val = values[config.variableName!];
            if (typeof val === "string") {
              const regex = new RegExp(config.pattern!);
              if (!regex.test(val)) {
                errors.push(
                  `Variable '${config.variableName!}' value does not match regex pattern '${config.pattern!}'`,
                );
              }
            }
          }
        }
      }

      const valid = errors.length === 0;
      const duration = Date.now() - startTime;

      if (valid) {
        this.logger.info(
          `Validation completed successfully for template: ${id}`,
          {
            templateId: id,
            operation: "validate_template_success",
            validationDuration: duration,
            validationResult: "SUCCESS",
            errorCount: 0,
            timestamp: new Date().toISOString(),
          },
        );
      } else {
        this.logger.warn(`Validation failed for template: ${id}`, {
          templateId: id,
          operation: "validate_template_failed",
          validationDuration: duration,
          validationResult: "FAILED",
          errorCount: errors.length,
          errors,
          timestamp: new Date().toISOString(),
        });
      }

      return { valid, errors };
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Validation error for template: ${id}`, err.stack, {
        templateId: id,
        operation: "validate_template_error",
        validationDuration: duration,
        validationResult: "ERROR",
        errorCount: 1,
        errorMessage: err.message,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  private checkType(val: unknown, type: string): boolean {
    if (type === "STRING") return typeof val === "string";
    if (type === "NUMBER") return typeof val === "number";
    if (type === "BOOLEAN") return typeof val === "boolean";
    if (type === "ARRAY") return Array.isArray(val);
    if (type === "CODE") return typeof val === "string";
    return false;
  }

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

  // Question generation pipeline
  async generateQuestionForTemplate(id: string): Promise<any> {
    // 1. Load template
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    // 2. Resolve variables definition
    let variablesDef: any[] = [];
    const varSchema = template.variableSchema as any;
    if (varSchema && Array.isArray(varSchema.variables)) {
      variablesDef = varSchema.variables;
    } else {
      // Fetch from repository relation
      const dbVars = await this.templateVariableRepository.findAll({
        templateId: id,
      });
      variablesDef = dbVars.map((v) => ({
        name: v.variableName,
        type: v.variableType.toLowerCase(),
        min: 1,
        max: 100,
        defaultValue: v.defaultValue,
      }));
    }

    // 3. Resolve constraints definition
    let constraintsDef: any[] = [];
    const consSchema = template.constraints as any;
    if (consSchema && Array.isArray(consSchema.constraints)) {
      constraintsDef = consSchema.constraints;
    } else {
      // Fetch from repository relation
      const dbRules = await this.templateRuleRepository.findAll({
        templateId: id,
      });
      constraintsDef = dbRules.map((r) => ({
        rule: (r.ruleConfig as any).pattern || (r.ruleConfig as any).rule || "",
        severity: "critical",
      }));
    }

    // 4. Resolve structure (questionTemplate, optionsTemplate, etc.)
    const structure = (template.structure as any) || {};
    const questionTemplate =
      structure.questionTemplate ||
      structure.questionStatement ||
      structure.prompt ||
      "";
    const optionsTemplate = parseOptionsTemplate(structure.optionsTemplate);

    // 5. Resolve solution / explanation
    const solutionSchema = (template.solutionSchema as any) || {};
    const finalAnswerExpression = solutionSchema.finalAnswer || "";
    let explanationTemplate = "";

    // If solutionSchema doesn't have explanation, check solutionTemplate relation
    const solTemplate = await this.prisma.solutionTemplate.findUnique({
      where: { templateId: id },
    });
    if (solTemplate) {
      explanationTemplate = solTemplate.explanationTemplate || "";
    }

    // Generate loop with retry policy (maximum 20 attempts)
    let attempts = 0;
    const maxAttempts = 20;
    let parameters: Record<string, any> = {};
    let isConstraintValid = false;
    let questionText = "";
    let options: string[] = [];
    let correctAnswer = "";
    let explanation = "";
    let questionHash = "";
    let prngSeed = 0;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        prngSeed = Math.floor(Math.random() * 1000000);
        const prng = new PRNG(prngSeed);

        // Log seed and variable defs for reproducibility
        this.logger.debug("Generation attempt starting", {
          attempt: attempts,
          prngSeed,
          variableCount: variablesDef.length,
        });

        // Generate values
        parameters = generateVariables(variablesDef, prng);
        this.logger.debug("Generated parameters", {
          prngSeed,
          parameters,
        });

        // Validate constraints
        const constraintCheck = evaluateConstraints(constraintsDef, parameters);
        this.logger.debug("Constraint check result", {
          prngSeed,
          isValid: constraintCheck.isValid,
          details: constraintCheck,
        });
        if (!constraintCheck.isValid) {
          continue;
        }

        // Render question text
        questionText = hydrateString(questionTemplate, parameters);

        // Render explanation
        explanation = hydrateString(
          explanationTemplate || solutionSchema.explanationTemplate || "",
          parameters,
        );

        // Render options
        options = optionsTemplate.map((opt: string) =>
          hydrateString(opt, parameters),
        );

        // Generate distractors if none provided
        if (options.length === 0) {
          let ansVal = 0;
          try {
            const res = evaluateExpression(finalAnswerExpression, parameters);
            ansVal = typeof res === "number" ? res : parseFloat(String(res));
          } catch {
            ansVal = 1;
          }
          const distractors = generateDistractors(ansVal);
          const isAnswerInt = Number.isInteger(ansVal);
          const formattedAnswer = String(
            roundToPrecision(ansVal, isAnswerInt ? 1 : 0.01),
          );
          options = prng.shuffle([formattedAnswer, ...distractors]);
        }

        // Generate Answer
        try {
          if (
            solutionSchema.correctVariable &&
            parameters.hasOwnProperty(solutionSchema.correctVariable)
          ) {
            correctAnswer = String(parameters[solutionSchema.correctVariable]);
          } else if (solutionSchema.formula) {
            this.logger.debug("Evaluating solutionSchema.formula", {
              prngSeed,
              formula: solutionSchema.formula,
            });
            const ansVal = evaluateExpression(
              solutionSchema.formula,
              parameters,
            );
            correctAnswer = String(ansVal);
          } else if (finalAnswerExpression) {
            this.logger.debug("Evaluating finalAnswerExpression", {
              prngSeed,
              finalAnswerExpression,
            });
            const ansVal = evaluateExpression(
              finalAnswerExpression,
              parameters,
            );
            correctAnswer = String(ansVal);
          } else if (solutionSchema.correctOptionIndex !== undefined) {
            const idx = solutionSchema.correctOptionIndex;
            if (idx >= 0 && idx < options.length) {
              correctAnswer = options[idx];
            }
          } else if (solutionSchema.value !== undefined) {
            correctAnswer = String(solutionSchema.value);
          } else {
            correctAnswer = options[0] || "0";
          }
          this.logger.debug("Computed correct answer", {
            prngSeed,
            correctAnswer,
          });
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          this.logger.error(
            "Error while computing answer",
            error.stack || error.message,
            {
              prngSeed,
              solutionSchema,
              finalAnswerExpression,
              parameters,
            },
          );
          correctAnswer = "0";
        }

        // Option Validation (QGES Stage 7)
        if (
          options.length === 0 ||
          options.some((o) => !o || o.trim() === "")
        ) {
          continue;
        }
        if (new Set(options).size !== options.length) {
          continue;
        }
        if (!options.includes(correctAnswer)) {
          continue;
        }

        // Unresolved placeholder detection
        if (
          this.hasUnresolvedPlaceholders(questionText) ||
          options.some((o) => this.hasUnresolvedPlaceholders(o)) ||
          this.hasUnresolvedPlaceholders(explanation)
        ) {
          continue;
        }

        // Hash generated question for duplicate checking
        questionHash = createHash("sha256")
          .update(
            `${template.id}_${questionText}_${options.join(",")}_${correctAnswer}`,
          )
          .digest("hex");

        // Check if question exists in GeneratedQuestion table
        const existing = await this.prisma.generatedQuestion.findUnique({
          where: { questionHash },
        });

        if (existing) {
          continue;
        }

        isConstraintValid = true;
        break;
      } catch (err) {
        // Log generation failure attempt
      }
    }

    if (!isConstraintValid) {
      await this.prisma.template.update({
        where: { id: template.id },
        data: {
          readinessStatus: "ERROR",
          lastReadinessCheckAt: new Date(),
          lastReadinessError: "Failed to generate variables satisfying constraints after 20 attempts",
        },
      });

      throw new BadRequestException({
        success: false,
        error: {
          code: "CONSTRAINT_VIOLATION",
          message:
            "Failed to generate variables satisfying constraints after 20 attempts",
        },
      });
    }

    // Save entity to pool (Zero Schema Change: store explanation in solution field, variables in metadata)
    const saved = await this.prisma.generatedQuestion.create({
      data: {
        template: { connect: { id: template.id } },
        questionHash,
        conceptKey: template.conceptKey,
        difficultyLevel: template.difficultyLevel,
        questionType: template.questionType,
        questionText,
        options,
        correctAnswer,
        solution: explanation, // store explanation in solution JSON field
        metadata: {
          ...parameters,
          status: "GENERATED",
          _generationSeed: prngSeed,
          _templateVersion: template.version,
        },
      },
    });

    await this.prisma.template.update({
      where: { id: template.id },
      data: {
        readinessStatus: "READY",
        lastReadinessCheckAt: new Date(),
        lastReadinessError: null,
      },
    });

    return {
      success: true,
      question: {
        id: saved.id,
        templateId: saved.templateId,
        conceptKey: saved.conceptKey,
        questionText: saved.questionText,
        variables: saved.metadata,
        options: saved.options,
        answer: saved.correctAnswer,
        explanation: saved.solution,
      },
      answer: saved.correctAnswer,
      explanation: saved.solution,
    };
  }

  // Batch Generation Engine
  async generateBatchForTemplate(
    id: string,
    count: number,
    saveToPool = true,
  ): Promise<{ generated: number; failed: number; questionIds: string[] }> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    let generatedCount = 0;
    let failedCount = 0;
    const questionIds: string[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const result = await this.generateQuestionForTemplate(id);
        if (result && result.question && result.question.id) {
          questionIds.push(result.question.id);
          generatedCount++;

          if (!saveToPool) {
            await this.prisma.generatedQuestion.delete({
              where: { id: result.question.id },
            });
          }
        } else {
          failedCount++;
        }
      } catch (err) {
        failedCount++;
      }
    }

    return {
      generated: generatedCount,
      failed: failedCount,
      questionIds,
    };
  }

  // Question Validation Engine
  validateGeneratedQuestion(question: {
    questionText?: string;
    options?: any;
    correctAnswer?: any;
    solution?: any;
    templateId?: string;
    conceptKey?: string;
    difficultyLevel?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!question.questionText || question.questionText.trim() === "") {
      errors.push(
        "Question text exists validation failed: questionText is missing or empty",
      );
    }

    let parsedOptions: string[] = [];
    if (Array.isArray(question.options)) {
      parsedOptions = question.options.map((o) => String(o).trim());
    } else if (typeof question.options === "string") {
      try {
        const parsed = JSON.parse(question.options);
        if (Array.isArray(parsed)) {
          parsedOptions = parsed.map((o) => String(o).trim());
        }
      } catch (e) {}
    } else if (question.options && typeof question.options === "object") {
      const opts =
        (question.options as any).options || (question.options as any).choices;
      if (Array.isArray(opts)) {
        parsedOptions = opts.map((o: any) => String(o).trim());
      }
    }

    if (parsedOptions.length === 0) {
      errors.push(
        "Options complete validation failed: options must be a non-empty array",
      );
    } else {
      if (parsedOptions.some((o) => !o || String(o).trim() === "")) {
        errors.push(
          "Reject on empty option: options must not contain empty values",
        );
      }
      if (new Set(parsedOptions).size !== parsedOptions.length) {
        errors.push("Reject on duplicate options: options must be unique");
      }
    }

    if (
      question.correctAnswer === undefined ||
      question.correctAnswer === null ||
      String(question.correctAnswer).trim() === ""
    ) {
      errors.push(
        "Reject on missing answer: correctAnswer is missing or empty",
      );
    } else if (
      question.options &&
      Array.isArray(question.options) &&
      !question.options.includes(String(question.correctAnswer))
    ) {
      errors.push(
        "Exactly one correct answer validation failed: correctAnswer must match one of the options",
      );
    }

    const explanationText =
      typeof question.solution === "string"
        ? question.solution
        : String(question.solution || "");
    if (!question.solution || explanationText.trim() === "") {
      errors.push(
        "Explanation exists validation failed: solution/explanation is missing or empty",
      );
    }

    if (!question.templateId || question.templateId.trim() === "") {
      errors.push(
        "Template reference exists validation failed: templateId is missing",
      );
    }

    if (!question.conceptKey || question.conceptKey.trim() === "") {
      errors.push("Concept exists validation failed: conceptKey is missing");
    }

    if (!question.difficultyLevel || question.difficultyLevel.trim() === "") {
      errors.push(
        "Difficulty assigned validation failed: difficultyLevel is missing",
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private hasUnresolvedPlaceholders(text: string): boolean {
    return (
      /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/.test(text) || /\{([^}]+)\}/.test(text)
    );
  }

  async findDatasetConfig(templateId: string) {
    return this.prisma.templateDatasetConfig.findUnique({
      where: { templateId },
    });
  }

  async upsertDatasetConfig(templateId: string, datasetId: string) {
    const existing = await this.findDatasetConfig(templateId);
    if (existing) {
      return this.prisma.templateDatasetConfig.update({
        where: { templateId },
        data: { datasetId },
      });
    }
    return this.prisma.templateDatasetConfig.create({
      data: {
        templateId,
        datasetId,
        selectionMethod: "RANDOM",
        tags: [],
      },
    });
  }

  /**
   * Apply an AI-drafted strategy to a template.
   *
   * This method:
   * 1. validates the draft structure
   * 2. normalizes it into the template's JSON format
   * 3. updates variableSchema and constraints fields
   * 4. uses the existing update flow (no schema change)
   *
   * The draft must have already been validated by StrategyDraftingService.
   */
  async applyDraftedStrategy(
    templateId: string,
    draft: any,
  ): Promise<{ success: boolean; templateId: string; updated: boolean }> {
    // 1. Ensure template exists
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    // 2. Validate draft structure and strategy semantics
    if (
      !draft.variables ||
      !Array.isArray(draft.variables) ||
      !draft.derivedVariables ||
      !Array.isArray(draft.derivedVariables) ||
      !draft.constraints ||
      !Array.isArray(draft.constraints)
    ) {
      throw new BadRequestException("Invalid draft structure");
    }

    const validation = this.canonicalizationService.validateDraft(draft);
    if (validation.errors.length > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "INVALID_STRATEGY_DRAFT",
          message:
            "Drafted strategy contains invalid variable or constraint definitions.",
          details: validation.errors,
        },
      });
    }

    // 3. Normalize and build update payload (uses existing format)
    const updatePayload = this.buildUpdatePayloadFromDraft(draft, template);

    // 4. Apply using the existing template update flow
    const updated = await this.templateRepository.update(
      templateId,
      updatePayload,
    );

    this.logger.debug("Applied drafted strategy to template", {
      templateId,
      variableCount: draft.variables.length,
      derivedCount: draft.derivedVariables.length,
      constraintCount: draft.constraints.length,
    });

    // 5. Invalidate caches
    await this.cacheService.invalidateTemplate(templateId);
    await this.cacheService.clear("template:list:*");

    return {
      success: true,
      templateId,
      updated: true,
    };
  }

  /**
   * Build the update payload from a drafted strategy.
   * Converts AI-generated structure into the template's expected JSON format
   * while preserving the existing manual schema keys and values.
   */
  private buildUpdatePayloadFromDraft(
    draft: any,
    template?: {
      variableSchema?: unknown;
      constraints?: unknown;
    },
  ): Prisma.TemplateUpdateInput {
    const payload: Prisma.TemplateUpdateInput = {};

    const existingVariableSchema =
      (template?.variableSchema as Record<string, any>) || {};
    const existingConstraintsSchema =
      (template?.constraints as Record<string, any>) || {};

    const normalizedConstraints = (draft.constraints || []).map((item: any) => {
      const rule = typeof item?.rule === "string" ? item.rule.trim() : "";
      const normalizedRule =
        this.canonicalizationService.normalizeConstraintRule(rule);
      const severity = item?.severity === "warning" ? "warning" : "critical";
      const parsed = this.parseConstraintRule(normalizedRule);

      return {
        rule: normalizedRule,
        severity,
        ...(parsed || {}),
      };
    });

    const normalizedRules = normalizedConstraints
      .map((item: any) => item.rule)
      .filter(
        (rule: unknown): rule is string =>
          typeof rule === "string" && rule.length > 0,
      );

    const draftVariables = draft.variables || [];
    const draftDerivedVariables = draft.derivedVariables || [];
    const draftFormulas = (draftDerivedVariables || []).map(
      (d: any) => `${d.name} = ${d.expression}`,
    );

    const variables = draftVariables;
    const derivedVariables = draftDerivedVariables;
    const formulas = draftFormulas;

    const variableSchema = {
      ...existingVariableSchema,
      variables,
      derivedVariables,
      formulas,
      generationStrategyConfig: {
        ...(existingVariableSchema.generationStrategyConfig || {}),
        variables,
        derivedVariables,
        constraints: normalizedConstraints,
        formulas,
      },
    };

    payload.variableSchema = variableSchema as Prisma.InputJsonValue;

    const constraintsSchema = {
      ...existingConstraintsSchema,
      constraints: normalizedConstraints,
      rules: normalizedRules,
      generationStrategyConfig: {
        ...(existingConstraintsSchema.generationStrategyConfig || {}),
        variables,
        derivedVariables,
        constraints: normalizedConstraints,
        formulas,
      },
    };

    payload.constraints = constraintsSchema as Prisma.InputJsonValue;

    return payload;
  }

  private mergeByName<T extends { name: string }>(
    existing: T[],
    incoming: T[],
  ): T[] {
    const merged = [...existing, ...incoming];
    const deduped = new Map<string, T>();

    for (const entry of merged) {
      if (!entry || typeof entry.name !== "string" || !entry.name.trim()) {
        continue;
      }
      deduped.set(entry.name, entry);
    }

    return Array.from(deduped.values());
  }

  private mergeByRule<T extends { rule?: string }>(
    existing: T[],
    incoming: T[],
  ): T[] {
    const merged = [...existing, ...incoming];
    const deduped = new Map<string, T>();

    for (const entry of merged) {
      if (!entry || typeof entry.rule !== "string" || !entry.rule.trim()) {
        continue;
      }
      deduped.set(entry.rule.trim(), entry);
    }

    return Array.from(deduped.values());
  }

  private mergeUniqueStrings(existing: string[], incoming: string[]): string[] {
    const merged = [...existing, ...incoming];
    const deduped = new Map<string, string>();

    for (const entry of merged) {
      if (typeof entry !== "string" || !entry.trim()) {
        continue;
      }
      deduped.set(entry.trim(), entry.trim());
    }

    return Array.from(deduped.values());
  }

  private parseConstraintRule(rule: string): {
    target?: string;
    operator?: string;
    value?: string;
  } | null {
    if (!rule) {
      return null;
    }

    const match = rule.match(
      /^([A-Za-z_][A-Za-z0-9_]*)\s*(>=|<=|!=|==|=|>|<)\s*(.+)$/,
    );
    if (!match) {
      return null;
    }

    return {
      target: match[1],
      operator: match[2],
      value: match[3].trim(),
    };
  }

  private validateStrategyPayload(
    variableSchema: any,
    constraints: any,
  ): string[] {
    const variables = Array.isArray(variableSchema?.variables)
      ? variableSchema.variables
      : [];
    const derivedVariables = Array.isArray(variableSchema?.derivedVariables)
      ? variableSchema.derivedVariables
      : Array.isArray(variableSchema?.formulas)
        ? variableSchema.formulas.map((formula: any, index: number) => {
            if (typeof formula !== "string") {
              return { name: `formula_${index}`, expression: "" };
            }
            const [name, ...parts] = formula.split("=");
            return {
              name: name?.trim() || `formula_${index}`,
              expression: parts.join("=").trim(),
            };
          })
        : [];

    return this.validateDraftedStrategy({
      variables,
      derivedVariables,
      constraints: Array.isArray(constraints) ? constraints : [],
    });
  }

  private validateDraftedStrategy(draft: any): string[] {
    const errors: string[] = [];

    const variableNames = new Set<string>();
    const derivedNames = new Set<string>();

    for (const variable of draft.variables) {
      if (!variable?.name || typeof variable.name !== "string") {
        errors.push("Each variable must have a valid name.");
        continue;
      }
      if (variableNames.has(variable.name)) {
        errors.push(`Duplicate variable name: ${variable.name}`);
      }
      variableNames.add(variable.name);

      if (
        variable.type === "number" ||
        variable.type === "integer" ||
        variable.type === "decimal"
      ) {
        if (variable.min !== undefined && variable.max !== undefined) {
          if (
            typeof variable.min !== "number" ||
            typeof variable.max !== "number"
          ) {
            errors.push(
              `Variable ${variable.name} must have numeric min and max values.`,
            );
          } else if (variable.min > variable.max) {
            errors.push(
              `Variable ${variable.name} has invalid range: min ${variable.min} cannot be greater than max ${variable.max}.`,
            );
          }
        }

        if (variable.generator) {
          const generator = String(variable.generator).toLowerCase();
          if (
            generator === "even" ||
            generator === "odd" ||
            generator === "prime"
          ) {
            if (variable.type === "decimal") {
              errors.push(
                `Generator '${generator}' is incompatible with decimal variable ${variable.name}.`,
              );
            }
            if (
              generator === "prime" &&
              (variable.min === undefined || variable.max === undefined)
            ) {
              errors.push(
                `Prime generator requires explicit min and max for variable ${variable.name}.`,
              );
            }
          }
        }
      }
    }

    for (const derived of draft.derivedVariables) {
      if (!derived?.name || typeof derived.name !== "string") {
        errors.push("Each derived variable must have a valid name.");
        continue;
      }
      if (derivedNames.has(derived.name)) {
        errors.push(`Duplicate derived variable name: ${derived.name}`);
      }
      derivedNames.add(derived.name);
      if (!derived.expression || typeof derived.expression !== "string") {
        errors.push(
          `Derived variable ${derived.name} must have a valid expression.`,
        );
      }
      if (variableNames.has(derived.name)) {
        errors.push(
          `Derived variable name ${derived.name} conflicts with a base variable name.`,
        );
      }
    }

    const formulaMap = new Map<string, string>();
    for (const derived of draft.derivedVariables) {
      if (derived?.name && typeof derived.expression === "string") {
        formulaMap.set(derived.name, derived.expression);
      }
    }

    const formulaDeps = new Map<string, string[]>();
    for (const [name, expression] of formulaMap.entries()) {
      const unsupportedFunctions = getUnsupportedMathjsFunctions(expression);
      if (unsupportedFunctions.length > 0) {
        errors.push(
          `Derived variable ${name} uses unsupported function(s): ${unsupportedFunctions.join(", ")}.`,
        );
      }
      const deps = analyzeMathjsExpression(expression).identifiers.filter(
        (dep) => dep !== name,
      );
      formulaDeps.set(name, deps);
    }

    const cycle = this.detectCycle(formulaDeps);
    if (cycle.length > 0) {
      errors.push(
        `Circular dependency in derived variables: ${cycle.join(" -> ")}`,
      );
    }

    const parameterNames = new Set<string>([...variableNames, ...derivedNames]);
    for (const constraint of draft.constraints) {
      if (!constraint?.rule || typeof constraint.rule !== "string") {
        errors.push("Each constraint must include a rule string.");
        continue;
      }
      try {
        math.parse(constraint.rule);
      } catch (err: any) {
        errors.push(
          `Invalid constraint formula: ${constraint.rule} (${err.message})`,
        );
      }

      const unsupportedFunctions = getUnsupportedMathjsFunctions(
        constraint.rule,
      );
      if (unsupportedFunctions.length > 0) {
        errors.push(
          `Constraint uses unsupported function(s): ${unsupportedFunctions.join(", ")}.`,
        );
      }
      const identifiers = analyzeMathjsExpression(constraint.rule).identifiers;
      for (const id of identifiers) {
        if (!parameterNames.has(id)) {
          errors.push(
            `Constraint references undefined variable or derived variable: ${id}`,
          );
        }
      }
    }

    return errors;
  }

  private validateSolutionSchema(
    solutionSchema: any,
    variableSchema: any,
  ): string[] {
    const errors: string[] = [];
    if (!solutionSchema || typeof solutionSchema !== "object") {
      return errors;
    }

    const variableNames =
      this.extractSolutionSchemaVariableNames(variableSchema);

    if (solutionSchema.correctVariable) {
      if (typeof solutionSchema.correctVariable !== "string") {
        errors.push(
          "solutionSchema.correctVariable must be a string reference to a defined variable.",
        );
      } else if (!variableNames.has(solutionSchema.correctVariable)) {
        errors.push(
          `solutionSchema.correctVariable references undefined variable: ${solutionSchema.correctVariable}`,
        );
      }
    }

    const expressions = [
      { key: "finalAnswer", value: solutionSchema.finalAnswer },
      { key: "formula", value: solutionSchema.formula },
    ];

    for (const { key, value } of expressions) {
      if (value === undefined || value === null) continue;
      if (typeof value !== "string") {
        errors.push(`solutionSchema.${key} must be a string expression.`);
        continue;
      }
      const expression = value.trim();
      if (expression.length === 0) {
        errors.push(`solutionSchema.${key} must not be empty.`);
        continue;
      }

      try {
        math.parse(expression);
      } catch (err: any) {
        errors.push(`Invalid solutionSchema.${key} expression: ${err.message}`);
        continue;
      }

      const unsupportedFunctions = getUnsupportedMathjsFunctions(expression);
      if (unsupportedFunctions.length > 0) {
        errors.push(
          `solutionSchema.${key} uses unsupported function(s): ${unsupportedFunctions.join(", ")}.`,
        );
      }
      const identifiers = analyzeMathjsExpression(expression).identifiers;
      for (const identifier of identifiers) {
        if (!variableNames.has(identifier)) {
          errors.push(
            `solutionSchema.${key} references undefined variable or derived variable: ${identifier}`,
          );
        }
      }

      const sampleContext: Record<string, number> = {};
      for (const identifier of identifiers) {
        sampleContext[identifier] = 2;
      }
      if (Object.keys(sampleContext).length > 0) {
        try {
          evaluateExpression(expression, sampleContext);
        } catch (err: any) {
          errors.push(
            `Unable to evaluate solutionSchema.${key} with sample values: ${err.message}`,
          );
        }
      }
    }

    return errors;
  }

  private extractSolutionSchemaVariableNames(variableSchema: any): Set<string> {
    const names = new Set<string>();
    if (Array.isArray(variableSchema?.variables)) {
      for (const variable of variableSchema.variables) {
        if (variable && typeof variable.name === "string") {
          names.add(variable.name);
        }
      }
    }
    if (Array.isArray(variableSchema?.derivedVariables)) {
      for (const derived of variableSchema.derivedVariables) {
        if (derived && typeof derived.name === "string") {
          names.add(derived.name);
        }
      }
    }
    if (Array.isArray(variableSchema?.formulas)) {
      for (const formula of variableSchema.formulas) {
        if (typeof formula === "string") {
          const [name] = formula.split("=");
          if (name && name.trim()) {
            names.add(name.trim());
          }
        }
      }
    }
    return names;
  }

  private extractIdentifierNames(expression: string): string[] {
    return analyzeMathjsExpression(expression).identifiers;
  }

  private detectCycle(deps: Map<string, string[]>): string[] {
    const visited = new Set<string>();
    const stack = new Set<string>();
    const path: string[] = [];
    let cyclePath: string[] = [];

    const dfs = (node: string): boolean => {
      if (stack.has(node)) {
        cyclePath = [...path.slice(path.indexOf(node)), node];
        return true;
      }
      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      stack.add(node);
      path.push(node);

      const neighbors = deps.get(node) || [];
      for (const neighbor of neighbors) {
        if (dfs(neighbor)) {
          return true;
        }
      }

      stack.delete(node);
      path.pop();
      return false;
    };

    for (const node of deps.keys()) {
      if (!visited.has(node) && dfs(node)) {
        return cyclePath;
      }
    }

    return [];
  }
}
