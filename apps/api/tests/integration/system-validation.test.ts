import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  ZodValidationPipe,
  GlobalExceptionFilter,
  ResponseInterceptor,
  ResponseValidationInterceptor,
} from "@intervu/shared";
import { SystemValidationController } from "../../src/modules/validation/controllers/system-validation.controller";
import { CrossModuleValidatorService } from "../../src/modules/validation/services/cross-module-validator.service";
import { ExamConfigRepository } from "../../src/modules/admin-config/repositories/exam-config.repository";
import { ExamSectionRepository } from "../../src/modules/admin-config/repositories/exam-section.repository";
import { TopicRepository } from "../../src/modules/concept-mapping/repositories/topic.repository";
import { ConceptMappingRepository } from "../../src/modules/concept-mapping/repositories/concept-mapping.repository";
import { TopicSectionMappingRepository } from "../../src/modules/topic-section-mapping/repositories/topic-section-mapping.repository";
import { TopicWeightageRepository } from "../../src/modules/topic-section-mapping/repositories/topic-weightage.repository";
import { TemplateRepository } from "../../src/modules/template-library/repositories/template.repository";
import { TemplateVariableRepository } from "../../src/modules/template-library/repositories/template-variable.repository";
import { TemplateRuleRepository } from "../../src/modules/template-library/repositories/template-rule.repository";
import { BlueprintService } from "../../src/modules/blueprint/services/blueprint.service";
import { BlueprintRepository } from "../../src/modules/blueprint/repositories/blueprint.repository";
import { JwtAuthGuard } from "../../src/modules/auth/guards/jwt-auth.guard";
import { PrismaService } from "../../src/prisma/prisma.service";

describe("System Validation Integration Tests", () => {
  let app: INestApplication;

  // Mock repositories and services
  const mockPrismaService = {
    ruleFlags: { findUnique: vi.fn() },
    difficultyDistribution: { findUnique: vi.fn() },
    solutionTemplate: { findUnique: vi.fn() },
    styleProfile: { findUnique: vi.fn() },
  };
  const mockConfigRepo = { findById: vi.fn() };
  const mockSectionRepo = { findManyByConfigId: vi.fn() };
  const mockTopicRepo = { findById: vi.fn() };
  const mockConceptRepo = { findManyByTopicId: vi.fn() };
  const mockTopicSectionMappingRepo = { findMappingsBySection: vi.fn() };
  const mockTopicWeightageRepo = { sumWeightagesBySection: vi.fn() };
  const mockTemplateRepo = { findAll: vi.fn() };
  const mockTemplateVarRepo = { findAll: vi.fn() };
  const mockTemplateRuleRepo = { findAll: vi.fn() };
  const mockBlueprintService = { validate: vi.fn() };
  const mockBlueprintRepo = { findByConfigId: vi.fn() };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SystemValidationController],
      providers: [
        CrossModuleValidatorService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ExamConfigRepository, useValue: mockConfigRepo },
        { provide: ExamSectionRepository, useValue: mockSectionRepo },
        { provide: TopicRepository, useValue: mockTopicRepo },
        { provide: ConceptMappingRepository, useValue: mockConceptRepo },
        {
          provide: TopicSectionMappingRepository,
          useValue: mockTopicSectionMappingRepo,
        },
        { provide: TopicWeightageRepository, useValue: mockTopicWeightageRepo },
        { provide: TemplateRepository, useValue: mockTemplateRepo },
        { provide: TemplateVariableRepository, useValue: mockTemplateVarRepo },
        { provide: TemplateRuleRepository, useValue: mockTemplateRuleRepo },
        { provide: BlueprintService, useValue: mockBlueprintService },
        { provide: BlueprintRepository, useValue: mockBlueprintRepo },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: "admin-user",
            email: "admin@intervu.ai",
            role: "ADMIN",
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new GlobalExceptionFilter());
    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(
      new ResponseInterceptor(),
      new ResponseValidationInterceptor(reflector),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /system/validate-config/:configId", () => {
    it("should return valid: true and score: 100 when everything is valid", async () => {
      const configId = "config-123";

      // 1. Mock Config Layer
      mockConfigRepo.findById.mockResolvedValue({
        id: configId,
        name: "Test Config",
        code: "TEST_CODE",
        role: "Software Engineer",
        totalQuestions: 10,
        durationMinutes: 60,
        isArchived: false,
        status: "ACTIVE",
      });

      mockSectionRepo.findManyByConfigId.mockResolvedValue([
        {
          id: "section-1",
          name: "Test Section",
          questionCount: 10,
        },
      ]);

      mockPrismaService.ruleFlags.findUnique.mockResolvedValue({ id: "rf-1" });
      mockPrismaService.difficultyDistribution.findUnique.mockResolvedValue({
        easyPercentage: 50,
        mediumPercentage: 50,
        hardPercentage: 0,
      });

      // 2. Mock Knowledge Layer
      mockTopicSectionMappingRepo.findMappingsBySection.mockResolvedValue([
        { topicId: "topic-1" },
      ]);
      mockTopicRepo.findById.mockResolvedValue({
        id: "topic-1",
        name: "Test Topic",
      });
      mockConceptRepo.findManyByTopicId.mockResolvedValue([
        { id: "concept-1", code: "CONCEPT_CODE", name: "Test Concept" },
      ]);
      mockTopicWeightageRepo.sumWeightagesBySection.mockResolvedValue(100);

      // 3. Mock Template Layer
      mockTemplateRepo.findAll.mockResolvedValue([
        {
          id: "template-1",
          conceptKey: "CONCEPT_CODE",
          isActive: true,
          name: "Test Template",
        },
      ]);
      mockTemplateVarRepo.findAll.mockResolvedValue([
        { variableName: "test_var", variableType: "NUMBER", defaultValue: "10" },
      ]);
      mockTemplateRuleRepo.findAll.mockResolvedValue([]);
      mockPrismaService.solutionTemplate.findUnique.mockResolvedValue({
        id: "sol-1",
        solutionTemplate: "return test_var;",
      });

      // 4. Mock Blueprint Layer
      mockBlueprintRepo.findByConfigId.mockResolvedValue({
        id: "blueprint-1",
        styleProfileId: "style-1",
      });
      mockBlueprintService.validate.mockResolvedValue({
        valid: true,
        errors: [],
      });
      mockPrismaService.styleProfile.findUnique.mockResolvedValue({
        id: "style-1",
        name: "Test Profile",
        active: true,
      });

      const res = await request(app.getHttpServer())
        .post(`/system/validate-config/${configId}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.score).toBe(100);
      expect(res.body.data.errors).toEqual([]);
      expect(res.body.data.breakdown.configuration.status).toBe("PASS");
      expect(res.body.data.breakdown.knowledge.status).toBe("PASS");
      expect(res.body.data.breakdown.templates.status).toBe("PASS");
      expect(res.body.data.breakdown.blueprint.status).toBe("PASS");
    });

    it("should return valid: false and correct breakdown status when layers fail", async () => {
      const configId = "config-123";

      // 1. Mock Config Layer (fails difficulty distribution total sum)
      mockConfigRepo.findById.mockResolvedValue({
        id: configId,
        name: "Test Config",
        code: "TEST_CODE",
        role: "Software Engineer",
        totalQuestions: 10,
        durationMinutes: 60,
        isArchived: false,
        status: "ACTIVE",
      });

      mockSectionRepo.findManyByConfigId.mockResolvedValue([
        {
          id: "section-1",
          name: "Test Section",
          questionCount: 10,
        },
      ]);

      mockPrismaService.ruleFlags.findUnique.mockResolvedValue({ id: "rf-1" });
      mockPrismaService.difficultyDistribution.findUnique.mockResolvedValue({
        easyPercentage: 40,
        mediumPercentage: 50,
        hardPercentage: 0, // Sums to 90%, should fail!
      });

      // 2. Mock Knowledge Layer (fails section topic mapping missing)
      mockTopicSectionMappingRepo.findMappingsBySection.mockResolvedValue([]);

      // 3. Mock Template Layer (fails missing templates for concept)
      mockTemplateRepo.findAll.mockResolvedValue([]);

      // 4. Mock Blueprint Layer (fails missing blueprint)
      mockBlueprintRepo.findByConfigId.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post(`/system/validate-config/${configId}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(false);
      expect(res.body.data.score).toBe(0);
      expect(res.body.data.errors.length).toBeGreaterThan(0);
      expect(res.body.data.breakdown.configuration.status).toBe("FAIL");
      expect(res.body.data.breakdown.knowledge.status).toBe("FAIL");
      expect(res.body.data.breakdown.templates.status).toBe("FAIL");
      expect(res.body.data.breakdown.blueprint.status).toBe("FAIL");
    });
  });
});
