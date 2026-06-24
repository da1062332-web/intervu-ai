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
import { BlueprintController } from "../../src/modules/blueprint/controllers/blueprint.controller";
import { BlueprintService } from "../../src/modules/blueprint/services/blueprint.service";
import { BlueprintCompilerService } from "../../src/modules/blueprint/services/blueprint-compiler.service";
import { BlueprintRepository } from "../../src/modules/blueprint/repositories/blueprint.repository";
import { TopicRegistryLoader } from "../../src/modules/concept-mapping/services/topic-registry-loader.service";
import { TemplateRepository } from "../../src/modules/template-library/repositories/template.repository";
import { JwtAuthGuard } from "../../src/modules/auth/guards/jwt-auth.guard";
import { PrismaService } from "../../src/prisma/prisma.service";
import { UserRole } from "@prisma/client";

describe("Blueprint Compilation Integration Tests", () => {
  let app: INestApplication;

  const mockBlueprintId = "blueprint-123";
  const mockConfigId = "config-123";

  // Mock repository/service functions
  const mockBlueprintRepo = {
    findByIdWithRelations: vi.fn(),
  };

  const mockBlueprintService = {
    validate: vi.fn(),
  };

  const mockTemplateRepo = {
    findAll: vi.fn(),
  };

  const mockPrismaService = {
    blueprint: {
      findUnique: vi.fn(),
    },
    readinessReport: {
      findFirst: vi.fn(),
    },
    concept: {
      findMany: vi.fn(),
    },
    template: {
      findMany: vi.fn(),
    },
    topic: {
      findUnique: vi.fn(),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BlueprintController],
      providers: [
        BlueprintCompilerService,
        { provide: BlueprintService, useValue: mockBlueprintService },
        { provide: BlueprintRepository, useValue: mockBlueprintRepo },
        { provide: TopicRegistryLoader, useValue: {} },
        { provide: TemplateRepository, useValue: mockTemplateRepo },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: "admin-user",
            email: "admin@intervu.ai",
            role: UserRole.ADMIN,
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

  describe("GET /api/v1/blueprints/:id/compilation-health", () => {
    it("should return correct compilation health when prerequisites are ready", async () => {
      // Setup mock returns
      mockBlueprintService.validate.mockResolvedValue({ valid: true, errors: [] });
      mockPrismaService.blueprint.findUnique.mockResolvedValue({
        id: mockBlueprintId,
        configId: mockConfigId,
        sections: [
          {
            sectionId: "section-1",
            questionCount: 10,
            topicAllocations: [{ topicId: "arrays", percentage: 100 }],
            difficultyAllocation: { easy: 100, medium: 0, hard: 0 },
          },
        ],
      });
      mockPrismaService.readinessReport.findFirst.mockResolvedValue({
        status: "READY",
      });
      mockPrismaService.concept.findMany.mockResolvedValue([
        { id: "c1", code: "arrays_basic" },
      ]);
      mockPrismaService.template.findMany.mockResolvedValue([
        { id: "tpl-1", templateKey: "TPL_ARRAYS_1", conceptKey: "arrays_basic", questionType: "multiple_choice" },
      ]);

      const res = await request(app.getHttpServer())
        .get(`/blueprints/${mockBlueprintId}/compilation-health`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.checks.templatesAvailable.status).toBe("PASS");
      expect(res.body.data.checks.conceptsAvailable.status).toBe("PASS");
      expect(res.body.data.checks.generationReady.status).toBe("PASS");
    });

    it("should flag failures when readiness report status is NOT_READY", async () => {
      mockBlueprintService.validate.mockResolvedValue({ valid: true, errors: [] });
      mockPrismaService.readinessReport.findFirst.mockResolvedValue({
        status: "NOT_READY",
      });

      const res = await request(app.getHttpServer())
        .get(`/blueprints/${mockBlueprintId}/compilation-health`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(false);
      expect(res.body.data.checks.generationReady.status).toBe("FAIL");
    });
  });

  describe("GET /api/v1/blueprints/:id/compilation-preview", () => {
    it("should return the allocations breakdown and requests preview", async () => {
      mockBlueprintService.validate.mockResolvedValue({ valid: true, errors: [] });
      mockPrismaService.readinessReport.findFirst.mockResolvedValue({
        status: "READY",
      });
      mockPrismaService.concept.findMany.mockResolvedValue([
        { id: "c1", code: "arrays_basic" },
      ]);
      mockPrismaService.template.findMany.mockResolvedValue([
        { id: "tpl-1", templateKey: "TPL_ARRAYS_1", conceptKey: "arrays_basic", questionType: "multiple_choice" },
      ]);
      mockPrismaService.topic.findUnique.mockResolvedValue({
        name: "Arrays and Lists",
      });

      const res = await request(app.getHttpServer())
        .get(`/blueprints/${mockBlueprintId}/compilation-preview`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.sections.length).toBe(1);
      expect(res.body.data.sections[0].allocations[0].topicName).toBe("Arrays and Lists");
      expect(res.body.data.requests.length).toBe(1);
      expect(res.body.data.requests[0].quantity).toBe(10);
    });
  });

  describe("POST /api/v1/blueprints/:id/compile", () => {
    it("should successfully compile and return batch metadata when valid", async () => {
      mockBlueprintService.validate.mockResolvedValue({ valid: true, errors: [] });
      mockPrismaService.readinessReport.findFirst.mockResolvedValue({
        status: "READY",
      });
      mockPrismaService.concept.findMany.mockResolvedValue([
        { id: "c1", code: "arrays_basic" },
      ]);
      mockPrismaService.template.findMany.mockResolvedValue([
        { id: "tpl-1", templateKey: "TPL_ARRAYS_1", conceptKey: "arrays_basic", questionType: "multiple_choice" },
      ]);

      const res = await request(app.getHttpServer())
        .post(`/blueprints/${mockBlueprintId}/compile`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.batchId).toBeDefined();
      expect(res.body.data.requestCount).toBe(10);
    });

    it("should reject compile and return bad request error when readiness is not READY", async () => {
      mockBlueprintService.validate.mockResolvedValue({ valid: true, errors: [] });
      mockPrismaService.readinessReport.findFirst.mockResolvedValue({
        status: "NOT_READY",
      });

      const res = await request(app.getHttpServer())
        .post(`/blueprints/${mockBlueprintId}/compile`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("Blueprint compilation failed validation");
    });
  });
});
