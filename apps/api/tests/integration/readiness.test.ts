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
import { ReadinessController } from "../../src/modules/validation/controllers/readiness.controller";
import { ReadinessEngineService } from "../../src/modules/validation/services/readiness-engine.service";
import { ReadinessReportRepository } from "../../src/modules/validation/repositories/readiness-report.repository";
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

describe("Readiness Engine Integration Tests", () => {
  let app: INestApplication;

  // Mock repositories and services
  const mockPrismaService = {
    topicWeightage: {
      findUnique: vi.fn(),
    },
    question: {
      count: vi.fn().mockResolvedValue(0),
    },
  };
  const mockConfigRepo = { findById: vi.fn() };
  const mockSectionRepo = { findManyByConfigId: vi.fn() };
  const mockTopicRepo = { findById: vi.fn() };
  const mockConceptRepo = { findManyByTopicId: vi.fn() };
  const mockTopicSectionMappingRepo = { findMappingsBySection: vi.fn() };
  const mockTopicWeightageRepo = { sumWeightagesBySection: vi.fn() };
  const mockTemplateRepo = { findAll: vi.fn(), findById: vi.fn() };
  const mockTemplateVarRepo = { findAll: vi.fn() };
  const mockTemplateRuleRepo = { findAll: vi.fn() };
  const mockBlueprintService = { validate: vi.fn() };
  const mockBlueprintRepo = { findByConfigId: vi.fn() };
  const mockReadinessReportRepo = {
    findLatestByConfigId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReadinessController],
      providers: [
        ReadinessEngineService,
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
        {
          provide: ReadinessReportRepository,
          useValue: mockReadinessReportRepo,
        },
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

  describe("POST /configs/:id/readiness", () => {
    it("should return READY (100 score) when all components are correctly configured", async () => {
      const configId = "config-e2e-123";

      // 1. Mock config exists
      mockConfigRepo.findById.mockResolvedValue({
        id: configId,
        name: "Backend Developer Assessment",
        code: "BACKEND_DEV",
        role: "Software Engineer",
        totalQuestions: 10,
        durationMinutes: 30,
        isArchived: false,
        status: "DRAFT",
      });

      // 2. Mock section configured
      mockSectionRepo.findManyByConfigId.mockResolvedValue([
        {
          id: "section-e2e-1",
          name: "NodeJS",
          questionCount: 10,
        },
      ]);

      // 3. Mock topics assigned
      mockTopicSectionMappingRepo.findMappingsBySection.mockResolvedValue([
        { topicId: "topic-e2e-1" },
      ]);

      // 4. Mock topic details
      mockTopicRepo.findById.mockResolvedValue({
        id: "topic-e2e-1",
        name: "Event Loop",
      });

      // 5. Mock concepts present
      mockConceptRepo.findManyByTopicId.mockResolvedValue([
        {
          id: "concept-e2e-1",
          code: "EVENT_LOOP_BASICS",
          name: "Event Loop Basics",
        },
      ]);

      // 6. Mock weightages sum to 100
      mockTopicWeightageRepo.sumWeightagesBySection.mockResolvedValue(100);

      // 7. Mock active templates present
      mockTemplateRepo.findAll.mockResolvedValue([
        {
          id: "template-e2e-1",
          conceptKey: "EVENT_LOOP_BASICS",
          isActive: true,
        },
      ]);
      mockTemplateRepo.findById.mockResolvedValue({
        id: "template-e2e-1",
        name: "Event Loop Template",
        isActive: true,
      });

      // 8. Mock valid variables
      mockTemplateVarRepo.findAll.mockResolvedValue([
        { variableName: "delay", variableType: "NUMBER", defaultValue: "100" },
      ]);

      // 9. Mock valid rules
      mockTemplateRuleRepo.findAll.mockResolvedValue([]);

      // 10. Mock blueprint exists
      mockBlueprintRepo.findByConfigId.mockResolvedValue({
        id: "blueprint-e2e-1",
      });

      // 11. Mock blueprint valid
      mockBlueprintService.validate.mockResolvedValue({
        valid: true,
        errors: [],
      });

      // 12. Mock report database operations
      mockReadinessReportRepo.findLatestByConfigId.mockResolvedValue(null);
      mockReadinessReportRepo.create.mockImplementation((dto: any) =>
        Promise.resolve({
          id: "report-e2e-1",
          configId: dto.examConfig.connect.id,
          score: dto.score,
          status: dto.status,
          report: dto.report,
        }),
      );

      const res = await request(app.getHttpServer())
        .post(`/configs/${configId}/readiness`)
        .send();

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.score).toBe(100);
      expect(res.body.data.status).toBe("READY");
      expect(res.body.data.checks.length).toBe(10);
      expect(res.body.data.checks.every((c: any) => c.status === "PASS")).toBe(
        true,
      );
    });

    it("should return FAIL for Manual Questions Pool when concept is MANUAL and available questions are insufficient", async () => {
      const configId = "config-e2e-123";

      // 1. Mock config exists
      mockConfigRepo.findById.mockResolvedValue({
        id: configId,
        name: "Backend Developer Assessment",
        code: "BACKEND_DEV",
        role: "Software Engineer",
        totalQuestions: 10,
        durationMinutes: 30,
        isArchived: false,
        status: "DRAFT",
      });

      // 2. Mock section configured
      mockSectionRepo.findManyByConfigId.mockResolvedValue([
        {
          id: "section-e2e-1",
          name: "NodeJS",
          questionCount: 10,
        },
      ]);

      // 3. Mock topics assigned
      mockTopicSectionMappingRepo.findMappingsBySection.mockResolvedValue([
        { topicId: "topic-e2e-1" },
      ]);

      // 4. Mock topic details
      mockTopicRepo.findById.mockResolvedValue({
        id: "topic-e2e-1",
        name: "Event Loop",
      });

      // 5. Mock concepts present with MANUAL source
      mockConceptRepo.findManyByTopicId.mockResolvedValue([
        {
          id: "concept-e2e-1",
          code: "EVENT_LOOP_BASICS",
          name: "Event Loop Basics",
          questionSources: ["MANUAL"],
        },
      ]);

      // 6. Mock weightages sum to 100
      mockTopicWeightageRepo.sumWeightagesBySection.mockResolvedValue(100);

      // Mock topicWeightage database findUnique call: weightage is 100%
      mockPrismaService.topicWeightage.findUnique.mockResolvedValue({
        weightagePercentage: 100,
      });

      // Mock question count call: return 2 manual questions (needs 10 questions)
      mockPrismaService.question.count.mockResolvedValue(2);

      // 11. Mock blueprint valid
      mockBlueprintService.validate.mockResolvedValue({
        valid: true,
        errors: [],
      });

      // 12. Mock report database operations
      mockReadinessReportRepo.findLatestByConfigId.mockResolvedValue(null);
      mockReadinessReportRepo.create.mockImplementation((dto: any) =>
        Promise.resolve({
          id: "report-e2e-2",
          configId: dto.examConfig.connect.id,
          score: dto.score,
          status: dto.status,
          report: dto.report,
        }),
      );

      const res = await request(app.getHttpServer())
        .post(`/configs/${configId}/readiness`)
        .send();

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Since manual pool is insufficient, score should be less than 100
      expect(res.body.data.score).toBeLessThan(100);
      const manualCheck = res.body.data.checks.find(
        (c: any) => c.name === "Manual Questions Pool",
      );
      expect(manualCheck).toBeDefined();
      expect(manualCheck.status).toBe("FAIL");
    });

    it("should pass templates check when no templates exist but active manual questions exist", async () => {
      const configId = "config-e2e-456";

      // 1. Mock config exists
      mockConfigRepo.findById.mockResolvedValue({
        id: configId,
        name: "Backend Developer Assessment",
        code: "BACKEND_DEV",
        role: "Software Engineer",
        totalQuestions: 10,
        durationMinutes: 30,
        isArchived: false,
        status: "DRAFT",
      });

      // 2. Mock section configured
      mockSectionRepo.findManyByConfigId.mockResolvedValue([
        {
          id: "section-e2e-1",
          name: "NodeJS",
          questionCount: 10,
        },
      ]);

      // 3. Mock topics assigned
      mockTopicSectionMappingRepo.findMappingsBySection.mockResolvedValue([
        { topicId: "topic-e2e-1" },
      ]);

      // 4. Mock topic details
      mockTopicRepo.findById.mockResolvedValue({
        id: "topic-e2e-1",
        name: "Event Loop",
      });

      // 5. Mock concepts present (defaulting to templates)
      mockConceptRepo.findManyByTopicId.mockResolvedValue([
        {
          id: "concept-e2e-1",
          code: "EVENT_LOOP_BASICS",
          name: "Event Loop Basics",
          questionSources: ["VARIABLE_TEMPLATE"],
        },
      ]);

      // 6. Mock weightages sum to 100
      mockTopicWeightageRepo.sumWeightagesBySection.mockResolvedValue(100);

      // 7. Mock no templates found
      mockTemplateRepo.findAll.mockResolvedValue([]);

      // 8. Mock manual questions exist
      mockPrismaService.question.count.mockResolvedValue(5);

      // 9. Mock valid variables & rules
      mockTemplateVarRepo.findAll.mockResolvedValue([]);
      mockTemplateRuleRepo.findAll.mockResolvedValue([]);

      // 10. Mock blueprint valid
      mockBlueprintRepo.findByConfigId.mockResolvedValue({
        id: "blueprint-e2e-1",
      });
      mockBlueprintService.validate.mockResolvedValue({
        valid: true,
        errors: [],
      });

      // 11. Mock report database operations
      mockReadinessReportRepo.findLatestByConfigId.mockResolvedValue(null);
      mockReadinessReportRepo.create.mockImplementation((dto: any) =>
        Promise.resolve({
          id: "report-e2e-3",
          configId: dto.examConfig.connect.id,
          score: dto.score,
          status: dto.status,
          report: dto.report,
        }),
      );

      const res = await request(app.getHttpServer())
        .post(`/configs/${configId}/readiness`)
        .send();

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.score).toBe(100);
      expect(res.body.data.status).toBe("READY");

      const templatesCheck = res.body.data.checks.find(
        (c: any) => c.name === "Templates Present",
      );
      expect(templatesCheck).toBeDefined();
      expect(templatesCheck.status).toBe("PASS");
    });
  });
});
