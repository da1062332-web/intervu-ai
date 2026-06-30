 
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
import { DifficultyDistributionController } from "../../src/modules/difficulty-distribution/controllers/difficulty-distribution.controller";
import { DifficultyDistributionService } from "../../src/modules/difficulty-distribution/services/difficulty-distribution.service";
import { DifficultyDistributionRepository } from "../../src/modules/difficulty-distribution/repositories/difficulty-distribution.repository";
import { RuleFlagsController } from "../../src/modules/rule-flags/controllers/rule-flags.controller";
import { RuleFlagsService } from "../../src/modules/rule-flags/services/rule-flags.service";
import { RuleFlagsRepository } from "../../src/modules/rule-flags/repositories/rule-flags.repository";
import { JwtAuthGuard } from "../../src/modules/auth/guards/jwt-auth.guard";

describe("Difficulty Distribution and Rule Flags Integration Tests", () => {
  let app: INestApplication;
  let difficultyRepoMock: Record<string, any>;
  let ruleFlagsRepoMock: Record<string, any>;

  beforeAll(async () => {
    difficultyRepoMock = {
      checkConfigExists: vi.fn(),
      findByConfigId: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    };

    ruleFlagsRepoMock = {
      checkConfigExists: vi.fn(),
      findByConfigId: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DifficultyDistributionController, RuleFlagsController],
      providers: [
        DifficultyDistributionService,
        {
          provide: DifficultyDistributionRepository,
          useValue: difficultyRepoMock,
        },
        RuleFlagsService,
        { provide: RuleFlagsRepository, useValue: ruleFlagsRepoMock },
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

  describe("Difficulty Distribution Flow", () => {
    const configId = "c111111111111111111111111";

    it("GET /admin/configs/:id/difficulty - should throw 404 if config does not exist", async () => {
      difficultyRepoMock.checkConfigExists.mockResolvedValueOnce(false);

      const res = await request(app.getHttpServer()).get(
        `/admin/configs/${configId}/difficulty`,
      );

      if (res.status !== 404) {
        console.log("Failed GET config exists body:", res.body);
      }
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("PATCH /admin/configs/:id/difficulty - should throw 400 if sum is not 100%", async () => {
      difficultyRepoMock.checkConfigExists.mockResolvedValueOnce(true);

      const res = await request(app.getHttpServer())
        .patch(`/admin/configs/${configId}/difficulty`)
        .send({
          easyPercentage: 30,
          mediumPercentage: 30,
          hardPercentage: 30,
        });

      if (res.status !== 400) {
        console.log("Failed PATCH sum body:", res.body);
      }
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_DISTRIBUTION_TOTAL");
    });

    it("PATCH /admin/configs/:id/difficulty - should save correctly if sum is 100%", async () => {
      difficultyRepoMock.checkConfigExists.mockResolvedValue(true);
      const mockResult = {
        id: "dist-1",
        examConfigId: configId,
        easyPercentage: 30,
        mediumPercentage: 50,
        hardPercentage: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      difficultyRepoMock.upsert.mockResolvedValue(mockResult);

      const res = await request(app.getHttpServer())
        .patch(`/admin/configs/${configId}/difficulty`)
        .send({
          easyPercentage: 30,
          mediumPercentage: 50,
          hardPercentage: 20,
        });

      if (res.status !== 200) {
        console.log("Failed PATCH correct sum body:", res.body);
      }
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.easyPercentage).toBe(30);
      expect(res.body.data.mediumPercentage).toBe(50);
      expect(res.body.data.hardPercentage).toBe(20);
    });

    it("GET /admin/configs/:id/difficulty - should return detail if it exists", async () => {
      difficultyRepoMock.checkConfigExists.mockResolvedValue(true);
      const mockResult = {
        id: "dist-1",
        examConfigId: configId,
        easyPercentage: 30,
        mediumPercentage: 50,
        hardPercentage: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      difficultyRepoMock.findByConfigId.mockResolvedValue(mockResult);

      const res = await request(app.getHttpServer()).get(
        `/admin/configs/${configId}/difficulty`,
      );

      if (res.status !== 200) {
        console.log("Failed GET detail body:", res.body);
      }
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.easyPercentage).toBe(30);
      expect(res.body.data.mediumPercentage).toBe(50);
      expect(res.body.data.hardPercentage).toBe(20);
    });
  });

  describe("Rule Flags Flow", () => {
    const configId = "c111111111111111111111111";

    it("GET /admin/configs/:id/rules - should return default values if none exist in repository", async () => {
      ruleFlagsRepoMock.checkConfigExists.mockResolvedValue(true);
      ruleFlagsRepoMock.findByConfigId.mockResolvedValue(null);

      const res = await request(app.getHttpServer()).get(
        `/admin/configs/${configId}/rules`,
      );

      if (res.status !== 200) {
        console.log("Failed GET default rules body:", res.body);
      }
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.negativeMarkingEnabled).toBe(false);
      expect(res.body.data.sectionalCutoffEnabled).toBe(false);
      expect(res.body.data.adaptiveDifficultyEnabled).toBe(false);
      expect(res.body.data.shuffleQuestionsEnabled).toBe(false);
      expect(res.body.data.shuffleOptionsEnabled).toBe(false);
      expect(res.body.data.allowSectionNavigation).toBe(false);
    });

    it("PATCH /admin/configs/:id/rules - should update and return new rule flags", async () => {
      ruleFlagsRepoMock.checkConfigExists.mockResolvedValue(true);
      const updatedMock = {
        id: "rules-1",
        examConfigId: configId,
        negativeMarkingEnabled: true,
        sectionalCutoffEnabled: true,
        adaptiveDifficultyEnabled: false,
        shuffleQuestionsEnabled: true,
        shuffleOptionsEnabled: false,
        allowSectionNavigation: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      ruleFlagsRepoMock.upsert.mockResolvedValue(updatedMock);

      const res = await request(app.getHttpServer())
        .patch(`/admin/configs/${configId}/rules`)
        .send({
          negativeMarkingEnabled: true,
          sectionalCutoffEnabled: true,
          adaptiveDifficultyEnabled: false,
          shuffleQuestionsEnabled: true,
          shuffleOptionsEnabled: false,
          allowSectionNavigation: true,
        });

      if (res.status !== 200) {
        console.log("Failed PATCH rules body:", res.body);
      }
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.negativeMarkingEnabled).toBe(true);
      expect(res.body.data.sectionalCutoffEnabled).toBe(true);
      expect(res.body.data.shuffleQuestionsEnabled).toBe(true);
      expect(res.body.data.allowSectionNavigation).toBe(true);
    });
  });
});
