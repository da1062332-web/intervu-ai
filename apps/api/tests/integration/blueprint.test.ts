/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { Test, TestingModule } from "@nestjs/testing";
import {
  INestApplication,
  Injectable,
  CanActivate,
  ExecutionContext,
} from "@nestjs/common";
import { Reflector, APP_GUARD } from "@nestjs/core";
import {
  ZodValidationPipe,
  GlobalExceptionFilter,
  ResponseInterceptor,
  ResponseValidationInterceptor,
} from "@intervu/shared";
import { StyleProfileController } from "../../src/modules/blueprint/controllers/style-profile.controller";
import { BlueprintController } from "../../src/modules/blueprint/controllers/blueprint.controller";
import { StyleProfileService } from "../../src/modules/blueprint/services/style-profile.service";
import { BlueprintService } from "../../src/modules/blueprint/services/blueprint.service";
import { BlueprintCompilerService } from "../../src/modules/blueprint/services/blueprint-compiler.service";
import { StyleProfileRepository } from "../../src/modules/blueprint/repositories/style-profile.repository";
import { BlueprintRepository } from "../../src/modules/blueprint/repositories/blueprint.repository";
import { TopicRegistryLoader } from "../../src/modules/concept-mapping/services/topic-registry-loader.service";
import { TemplateRepository } from "../../src/modules/template-library/repositories/template.repository";
import { RolesGuard } from "../../src/modules/auth/guards/roles.guard";
import { JwtAuthGuard } from "../../src/modules/auth/guards/jwt-auth.guard";
import { UserRole } from "@prisma/client";

// Mock Auth Guard that reads the role from custom header to mock JWT context dynamically
@Injectable()
class DynamicAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const roleHeader = req.headers["x-test-role"] || "ADMIN"; // Default to admin for non-rbac tests

    req.user = {
      id: "test-user-id",
      email: "test@intervu.ai",
      role: roleHeader as UserRole,
    };
    return true;
  }
}

describe("Style Profile & Blueprint Integration Tests", () => {
  let app: INestApplication;
  let styleProfileRepoMock: any;
  let blueprintRepoMock: any;
  let topicRegistryLoaderMock: any;
  let templateRepoMock: any;

  beforeAll(async () => {
    styleProfileRepoMock = {
      createWithCharacteristics: vi.fn(),
      findAll: vi.fn(),
      findAllWithCharacteristics: vi.fn(),
      findByIdWithCharacteristics: vi.fn(),
      updateWithCharacteristics: vi.fn(),
      findByName: vi.fn().mockResolvedValue(null),
    };

    blueprintRepoMock = {
      create: vi.fn(),
      findAll: vi.fn(),
      findAllWithRelations: vi.fn(),
      findByConfigId: vi.fn(),
      findByIdWithRelations: vi.fn(),
      update: vi.fn(),
    };

    topicRegistryLoaderMock = {
      getTopicById: vi.fn().mockImplementation((id) => {
        if (id === "se-ds-001") {
          return Promise.resolve({
            id: "se-ds-001",
            topic: "Data Structures",
            concepts: ["Traversal"],
          });
        }
        if (id === "se-algo-001") {
          return Promise.resolve({
            id: "se-algo-001",
            topic: "Algorithms",
            concepts: ["Binary Search"],
          });
        }
        return Promise.resolve(null);
      }),
    };

    templateRepoMock = {
      findAll: vi.fn().mockResolvedValue([
        {
          id: "t1",
          isActive: true,
          difficultyLevel: "EASY",
          conceptKey: "Traversal",
        },
        {
          id: "t2",
          isActive: true,
          difficultyLevel: "MEDIUM",
          conceptKey: "Traversal",
        },
        {
          id: "t3",
          isActive: true,
          difficultyLevel: "HARD",
          conceptKey: "Traversal",
        },
        {
          id: "t4",
          isActive: true,
          difficultyLevel: "MEDIUM",
          conceptKey: "Binary Search",
        },
        {
          id: "t5",
          isActive: true,
          difficultyLevel: "EASY",
          conceptKey: "Binary Search",
        },
        {
          id: "t6",
          isActive: true,
          difficultyLevel: "HARD",
          conceptKey: "Binary Search",
        },
      ]),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [StyleProfileController, BlueprintController],
      providers: [
        StyleProfileService,
        BlueprintService,
        { provide: BlueprintCompilerService, useValue: {} },
        { provide: StyleProfileRepository, useValue: styleProfileRepoMock },
        { provide: BlueprintRepository, useValue: blueprintRepoMock },
        { provide: TopicRegistryLoader, useValue: topicRegistryLoaderMock },
        { provide: TemplateRepository, useValue: templateRepoMock },
        {
          provide: APP_GUARD,
          useClass: DynamicAuthGuard,
        },
        {
          provide: APP_GUARD,
          useClass: RolesGuard,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
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

  describe("RBAC Route Protection", () => {
    it("should allow ADMIN to list style profiles", async () => {
      styleProfileRepoMock.findAllWithCharacteristics.mockResolvedValueOnce([]);

      const res = await request(app.getHttpServer())
        .get("/style-profiles")
        .set("x-test-role", "ADMIN");

      if (res.status !== 200) {
        console.log("Error Response Body:", JSON.stringify(res.body, null, 2));
      }

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should block CANDIDATE from listing style profiles", async () => {
      const res = await request(app.getHttpServer())
        .get("/style-profiles")
        .set("x-test-role", "CANDIDATE");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("Style Profile CRUD", () => {
    it("should create a style profile successfully", async () => {
      const mockProfile = {
        id: "profile-1",
        name: "Campus Profile",
        profileType: "campus",
        active: true,
        characteristics: [
          {
            characteristicName: "questionLength",
            characteristicValue: "short",
          },
        ],
      };
      styleProfileRepoMock.createWithCharacteristics.mockResolvedValueOnce(
        mockProfile,
      );

      const res = await request(app.getHttpServer())
        .post("/style-profiles")
        .set("x-test-role", "ADMIN")
        .send({
          name: "Campus Profile",
          profileType: "campus",
          characteristics: [{ name: "questionLength", value: "short" }],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe("profile-1");
    });
  });

  describe("Blueprint Validation & Preview Engine", () => {
    const blueprintId = "bp-123";
    const mockBlueprint = {
      id: blueprintId,
      configId: "config-123",
      styleProfileId: "profile-123",
      sections: [
        {
          sectionId: "sec-technical",
          questionCount: 20,
          topicAllocations: [
            { topicId: "se-ds-001", percentage: 60 },
            { topicId: "se-algo-001", percentage: 40 },
          ],
          difficultyAllocation: { easy: 50, medium: 40, hard: 10 },
          templateTypes: ["mcq"],
        },
      ],
    };

    it("should validate a correct blueprint successfully", async () => {
      blueprintRepoMock.findByIdWithRelations.mockResolvedValueOnce(
        mockBlueprint,
      );

      const res = await request(app.getHttpServer())
        .post(`/blueprints/${blueprintId}/validate`)
        .set("x-test-role", "ADMIN");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.errors).toHaveLength(0);
    });

    it("should reject a blueprint with invalid topic sums", async () => {
      const invalidBlueprint = {
        ...mockBlueprint,
        sections: [
          {
            ...mockBlueprint.sections[0],
            topicAllocations: [
              { topicId: "se-ds-001", percentage: 50 },
              { topicId: "se-algo-001", percentage: 30 }, // Total = 80%
            ],
          },
        ],
      };
      blueprintRepoMock.findByIdWithRelations.mockResolvedValueOnce(
        invalidBlueprint,
      );

      const res = await request(app.getHttpServer())
        .post(`/blueprints/${blueprintId}/validate`)
        .set("x-test-role", "ADMIN");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(false);
      expect(res.body.data.errors[0]).toContain(
        "Topic allocation total must be exactly 100%",
      );
    });

    it("should reject a blueprint targeting non-existent topics", async () => {
      const invalidBlueprint = {
        ...mockBlueprint,
        sections: [
          {
            ...mockBlueprint.sections[0],
            topicAllocations: [
              { topicId: "se-ds-999", percentage: 100 }, // Non-existent
            ],
          },
        ],
      };
      blueprintRepoMock.findByIdWithRelations.mockResolvedValueOnce(
        invalidBlueprint,
      );

      const res = await request(app.getHttpServer())
        .post(`/blueprints/${blueprintId}/validate`)
        .set("x-test-role", "ADMIN");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(false);
      expect(res.body.data.errors[0]).toContain(
        "does not exist in Topic Registry",
      );
    });

    it("should generate a blueprint preview structurally", async () => {
      blueprintRepoMock.findByIdWithRelations.mockResolvedValueOnce(
        mockBlueprint,
      );

      const res = await request(app.getHttpServer())
        .get(`/blueprints/${blueprintId}/preview`)
        .set("x-test-role", "ADMIN");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sections[0].questionCount).toBe(20);
      expect(res.body.data.sections[0].topics[0].expectedQuestions).toBe(12); // 60% of 20
    });
  });
});
