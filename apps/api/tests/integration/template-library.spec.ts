import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaService } from "../../src/prisma/prisma.service";
import { TemplateRepository } from "../../src/modules/template-library/repositories/template.repository";
import { TemplateVariableRepository } from "../../src/modules/template-library/repositories/template-variable.repository";
import { TemplateRuleRepository } from "../../src/modules/template-library/repositories/template-rule.repository";
import { TemplateService } from "../../src/modules/template-library/services/template.service";
import { RedisCacheService } from "../../src/cache/redis-cache.service";
import {
  VariableType as PrismaVariableType,
  RuleType as PrismaRuleType,
  DifficultyLevel,
} from "@prisma/client";
import { VariableType, RuleType } from "@intervu/shared";

describe("Template Library Integration Tests", () => {
  let prisma: PrismaService;
  let templateRepo: TemplateRepository;
  let variableRepo: TemplateVariableRepository;
  let ruleRepo: TemplateRuleRepository;
  let service: TemplateService;
  let cacheService: RedisCacheService;

  let testTemplateId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    templateRepo = new TemplateRepository(prisma);
    variableRepo = new TemplateVariableRepository(prisma);
    ruleRepo = new TemplateRuleRepository(prisma);

    // mock cache service
    cacheService = {
      getTemplateList: vi.fn().mockResolvedValue(null),
      setTemplateList: vi.fn().mockResolvedValue(null),
      getTemplate: vi.fn().mockResolvedValue(null),
      setTemplate: vi.fn().mockResolvedValue(null),
      getTemplatesByDifficulty: vi.fn().mockResolvedValue(null),
      setTemplatesByDifficulty: vi.fn().mockResolvedValue(null),
      getSystemTemplates: vi.fn().mockResolvedValue(null),
      setSystemTemplates: vi.fn().mockResolvedValue(null),
      invalidateSystemTemplates: vi.fn().mockResolvedValue(null),
      invalidateTemplate: vi.fn().mockResolvedValue(null),
      clear: vi.fn().mockResolvedValue(null),
    } as unknown as RedisCacheService;

    service = new TemplateService(
      prisma,
      templateRepo,
      variableRepo,
      ruleRepo,
      cacheService,
    );

    // Create a dummy template for testing
    const template = await prisma.template.create({
      data: {
        name: "Test Integration Template",
        difficulty: DifficultyLevel.MEDIUM,
        difficultyLevel: DifficultyLevel.MEDIUM,
        conceptKey: "integration-test",
        config: {},
      },
    });
    testTemplateId = template.id;
  });

  afterAll(async () => {
    // Cleanup template
    if (testTemplateId) {
      try {
        await prisma.template.delete({ where: { id: testTemplateId } });
      } catch {
        // ignore cleanup error if deleted already
      }
    }
    await prisma.$disconnect();
  });

  it("should handle Variable CRUD with validation and uniqueness constraints", async () => {
    // 1. Create Variable
    const variable = await service.createVariable(testTemplateId, {
      variableName: "port",
      variableType: VariableType.NUMBER,
      required: true,
      defaultValue: "8080",
    });
    expect(variable).toBeDefined();
    expect(variable.variableName).toBe("port");
    expect(variable.variableType).toBe(PrismaVariableType.NUMBER);

    // 2. Reject duplicate variable name
    await expect(
      service.createVariable(testTemplateId, {
        variableName: "port",
        variableType: VariableType.STRING,
      }),
    ).rejects.toThrow();

    // 3. Reject invalid default value type
    await expect(
      service.createVariable(testTemplateId, {
        variableName: "host",
        variableType: VariableType.NUMBER,
        defaultValue: "not-a-number",
      }),
    ).rejects.toThrow("is not compatible with type NUMBER");

    // 4. Update Variable
    const updated = await service.updateVariable(variable.id, {
      defaultValue: "9000",
    });
    expect(updated.defaultValue).toBe("9000");

    // 5. Fetch Variables
    const list = await service.getVariables(testTemplateId);
    expect(list.length).toBe(1);
    expect(list[0].variableName).toBe("port");
  });

  it("should handle Rule CRUD and enforce compatibility matrix", async () => {
    // 1. Add compatible rule (Range rule on NUMBER variable "port")
    const rule = await service.createRule(testTemplateId, {
      ruleType: RuleType.RANGE,
      ruleConfig: {
        variableName: "port",
        min: 1000,
        max: 9999,
      },
    });
    expect(rule).toBeDefined();
    expect(rule.ruleType).toBe(PrismaRuleType.RANGE);

    // 2. Reject incompatible rule combination (Regex on NUMBER variable "port")
    await expect(
      service.createRule(testTemplateId, {
        ruleType: RuleType.REGEX,
        ruleConfig: {
          variableName: "port",
          pattern: "^[a-z]+$",
        },
      }),
    ).rejects.toThrow("cannot be applied to variable");

    // 3. Reject invalid range configurations (min > max)
    await expect(
      service.createRule(testTemplateId, {
        ruleType: RuleType.RANGE,
        ruleConfig: {
          variableName: "port",
          min: 9999,
          max: 1000,
        },
      }),
    ).rejects.toThrow("min 9999 cannot be greater than max 1000");

    // 4. Fetch Rules
    const list = await service.getRules(testTemplateId);
    expect(list.length).toBe(1);
  });

  it("should validate inputs against variables and rules in Template Validation Engine", async () => {
    // 1. Success case
    const resSuccess = await service.validateTemplate(testTemplateId, {
      port: 8080,
    });
    expect(resSuccess.valid).toBe(true);
    expect(resSuccess.errors.length).toBe(0);

    // 2. Failure case (Missing required variable "port")
    const resMissing = await service.validateTemplate(testTemplateId, {});
    expect(resMissing.valid).toBe(false);
    expect(resMissing.errors).toContain("Variable 'port' is required");

    // 3. Failure case (Invalid variable type)
    const resInvalidType = await service.validateTemplate(testTemplateId, {
      port: "not-a-number",
    });
    expect(resInvalidType.valid).toBe(false);
    expect(resInvalidType.errors).toContain(
      "Variable 'port' must be of type NUMBER",
    );

    // 4. Failure case (Value out of range)
    const resOutOfRange = await service.validateTemplate(testTemplateId, {
      port: 500,
    });
    expect(resOutOfRange.valid).toBe(false);
    expect(resOutOfRange.errors.some((e) => e.includes("out of range"))).toBe(
      true,
    );
  });

  it("should execute cascade delete when deleting variables with dependent rules", async () => {
    // Get variable and dependent rule
    const vars = await service.getVariables(testTemplateId);
    const variable = vars.find((v) => v.variableName === "port");
    expect(variable).toBeDefined();

    // Verify rule exists
    const rules = await service.getRules(testTemplateId);
    expect(rules.length).toBe(1);

    // Delete variable
    await service.deleteVariable(variable!.id);

    // Verify variable deleted
    const varsAfter = await service.getVariables(testTemplateId);
    expect(varsAfter.length).toBe(0);

    // Verify dependent rules cascade deleted atomically
    const rulesAfter = await service.getRules(testTemplateId);
    expect(rulesAfter.length).toBe(0);
  });
}, 60000);
