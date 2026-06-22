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
} from "@prisma/client";
import { createHash } from "crypto";

import { RedisCacheService } from "../../../cache";
import { TemplateRepository } from "../repositories/template.repository";
import { TemplateVariableRepository } from "../repositories/template-variable.repository";
import { TemplateRuleRepository } from "../repositories/template-rule.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import { AppLogger } from "@intervu-ai/shared-logger";
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
  ) {}

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async findAll(
    page = 1,
    limit = 10,
    difficulty?: DifficultyLevel,
  ): Promise<PaginatedTemplates> {
    // 1. validate()
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "page must be ≥ 1 and limit must be between 1 and 100",
        },
      });
    }

    // 2. fetchDependencies() — check cache first
    const filterHash = createHash("md5")
      .update(`p${page}l${limit}d${difficulty ?? "all"}`)
      .digest("hex");
    const cached =
      await this.cacheService.getTemplateList<PaginatedTemplates>(filterHash);
    if (cached) return cached;

    // 3. coreLogic() — fetch from DB
    const whereClause: Record<string, unknown> = difficulty
      ? { difficulty }
      : {};
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

    // 3. coreLogic() — persist to DB
    const createInput: Prisma.TemplateCreateInput = {
      name: validated.name,
      description: validated.description,
      difficulty:
        (validated.difficulty as DifficultyLevel) ?? DifficultyLevel.MEDIUM,
      config: validated.config as Prisma.InputJsonValue,
      isSystem: validated.isSystem ?? false,
    };
    const template = await this.templateRepository.create(createInput);

    // 4. formatResponse() — invalidate list caches, return new template
    if (template.isSystem) {
      await this.cacheService.invalidateSystemTemplates();
    } else {
      await this.cacheService.clear("template:list:*");
    }
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
    if (validated.difficulty !== undefined)
      updateInput.difficulty = validated.difficulty as DifficultyLevel;
    if (validated.config !== undefined)
      updateInput.config = validated.config as Prisma.InputJsonValue;

    const updated = await this.templateRepository.update(id, updateInput);

    // 4. formatResponse() — invalidate stale caches, return updated template
    await this.cacheService.invalidateTemplate(id);
    if (updated.isSystem) {
      await this.cacheService.invalidateSystemTemplates();
    }
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
}
