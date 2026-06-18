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
import { ExamConfigController } from "../../src/modules/admin-config/controllers/exam-config.controller";
import { ExamSectionController } from "../../src/modules/admin-config/controllers/exam-section.controller";
import { ExamConfigService } from "../../src/modules/admin-config/services/exam-config.service";
import { ExamSectionService } from "../../src/modules/admin-config/services/exam-section.service";
import { ExamConfigRepository } from "../../src/modules/admin-config/repositories/exam-config.repository";
import { ExamSectionRepository } from "../../src/modules/admin-config/repositories/exam-section.repository";
import { JwtAuthGuard } from "../../src/modules/auth/guards/jwt-auth.guard";
import { ConfigStatus, ExamConfig, ExamSection } from "@prisma/client";

describe("Exam Config & Section Integration Tests", () => {
  let app: INestApplication;
  let configRepoMock: Record<string, ReturnType<typeof vi.fn>>;
  let sectionRepoMock: Record<string, ReturnType<typeof vi.fn>>;

  beforeAll(async () => {
    configRepoMock = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findByCode: vi.fn(),
      update: vi.fn(),
    };

    sectionRepoMock = {
      create: vi.fn(),
      findById: vi.fn(),
      findManyByConfigId: vi.fn(),
      findByConfigAndOrder: vi.fn(),
      findByConfigAndCode: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ExamConfigController, ExamSectionController],
      providers: [
        ExamConfigService,
        ExamSectionService,
        { provide: ExamConfigRepository, useValue: configRepoMock },
        { provide: ExamSectionRepository, useValue: sectionRepoMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: "admin-1",
            email: "admin@example.com",
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

  describe("Integration Flow", () => {
    const configId = "c111111111111111111111111";
    const sectionId = "c222222222222222222222222";

    const mockConfig: ExamConfig = {
      id: configId,
      name: "Engineering Assessment",
      code: "SWE_SCREENING_TEST",
      role: "Software Engineer",
      description: "Standard screening test",
      durationMinutes: 60,
      totalQuestions: 30,
      status: ConfigStatus.DRAFT,
      isArchived: false,
      isActive: true,
      createdBy: "admin-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSection: ExamSection = {
      id: sectionId,
      examConfigId: configId,
      name: "Algorithms",
      code: "ALGO",
      questionCount: 10,
      sectionDurationMinutes: 20,
      sectionOrder: 1,
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("1. Create Exam Configuration", async () => {
      configRepoMock.findByCode.mockResolvedValueOnce(null);
      configRepoMock.create.mockResolvedValueOnce(mockConfig);

      const res = await request(app.getHttpServer())
        .post("/admin/configs")
        .send({
          name: "Engineering Assessment",
          code: "SWE_SCREENING_TEST",
          role: "Software Engineer",
          description: "Standard screening test",
          durationMinutes: 60,
          totalQuestions: 30,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe("SWE_SCREENING_TEST");
      expect(res.body.data.status).toBe("DRAFT");
    });

    it("2. Add Exam Section to Configuration", async () => {
      configRepoMock.findById.mockResolvedValueOnce(mockConfig);
      sectionRepoMock.findByConfigAndCode.mockResolvedValueOnce(null);
      sectionRepoMock.findByConfigAndOrder.mockResolvedValueOnce(null);
      sectionRepoMock.create.mockResolvedValueOnce(mockSection);

      const res = await request(app.getHttpServer())
        .post(`/admin/configs/${configId}/sections`)
        .send({
          name: "Algorithms",
          code: "ALGO",
          questionCount: 10,
          sectionDurationMinutes: 20,
          sectionOrder: 1,
          isRequired: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe("ALGO");
      expect(res.body.data.sectionDurationMinutes).toBe(20);
    });

    it("3. Fetch Exam Configuration Details", async () => {
      configRepoMock.findById.mockResolvedValueOnce(mockConfig);

      const res = await request(app.getHttpServer()).get(
        `/admin/configs/${configId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(configId);
    });

    it("4. Update Section details", async () => {
      const updatedSection = {
        ...mockSection,
        name: "Data Structures",
        code: "DS",
      };
      sectionRepoMock.findById.mockResolvedValueOnce(mockSection);
      configRepoMock.findById.mockResolvedValueOnce(mockConfig);
      sectionRepoMock.findByConfigAndCode.mockResolvedValueOnce(null);
      sectionRepoMock.findByConfigAndOrder.mockResolvedValueOnce(null);
      sectionRepoMock.update.mockResolvedValueOnce(updatedSection);

      const res = await request(app.getHttpServer())
        .patch(`/admin/sections/${sectionId}`)
        .send({
          name: "Data Structures",
          code: "DS",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe("DS");
      expect(res.body.data.name).toBe("Data Structures");
    });

    it("5. Archive Exam Configuration", async () => {
      const archivedConfig = {
        ...mockConfig,
        isArchived: true,
        status: ConfigStatus.ARCHIVED,
      };
      configRepoMock.findById.mockResolvedValueOnce(mockConfig);
      configRepoMock.update.mockResolvedValueOnce(archivedConfig);

      const res = await request(app.getHttpServer()).delete(
        `/admin/configs/${configId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isArchived).toBe(true);
      expect(res.body.data.status).toBe("ARCHIVED");
    });

    it("6. Block modifications on section when parent config is archived", async () => {
      const archivedConfig = {
        ...mockConfig,
        isArchived: true,
        status: ConfigStatus.ARCHIVED,
      };
      sectionRepoMock.findById.mockResolvedValueOnce(mockSection);
      configRepoMock.findById.mockResolvedValueOnce(archivedConfig);

      const res = await request(app.getHttpServer())
        .patch(`/admin/sections/${sectionId}`)
        .send({
          name: "Cannot Change",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("CONFIG_ARCHIVED");
    });
  });
});
