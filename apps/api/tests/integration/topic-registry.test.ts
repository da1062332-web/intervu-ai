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
import { TopicController } from "../../src/modules/concept-mapping/controllers/topic.controller";
import { ConceptMappingController } from "../../src/modules/concept-mapping/controllers/concept-mapping.controller";
import { TopicService } from "../../src/modules/concept-mapping/services/topic.service";
import { ConceptMappingService } from "../../src/modules/concept-mapping/services/concept-mapping.service";
import { TopicRepository } from "../../src/modules/concept-mapping/repositories/topic.repository";
import { ConceptMappingRepository } from "../../src/modules/concept-mapping/repositories/concept-mapping.repository";
import { TopicRegistryLoader } from "../../src/modules/concept-mapping/services/topic-registry-loader.service";
import { JwtAuthGuard } from "../../src/modules/auth/guards/jwt-auth.guard";
import { Topic, Concept, TopicStatus, ConceptStatus } from "@prisma/client";

describe("Topic & Concept Registry Integration Tests", () => {
  let app: INestApplication;
  let topicRepoMock: Record<string, ReturnType<typeof vi.fn>>;
  let conceptRepoMock: Record<string, ReturnType<typeof vi.fn>>;
  let registryLoaderMock: Record<string, ReturnType<typeof vi.fn>>;

  beforeAll(async () => {
    topicRepoMock = {
      create: vi.fn(),
      findById: vi.fn(),
      findManyActive: vi.fn(),
      findByCode: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    conceptRepoMock = {
      create: vi.fn(),
      findById: vi.fn(),
      findManyByTopicId: vi.fn(),
      findByTopicAndCode: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    registryLoaderMock = {
      loadTopics: vi.fn(),
      getTopicById: vi.fn(),
      getAllTopics: vi.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TopicController, ConceptMappingController],
      providers: [
        TopicService,
        ConceptMappingService,
        { provide: TopicRepository, useValue: topicRepoMock },
        { provide: ConceptMappingRepository, useValue: conceptRepoMock },
        { provide: TopicRegistryLoader, useValue: registryLoaderMock },
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

  describe("Scenario Flow", () => {
    const topicId = "topic-uuid-123";
    const conceptId = "concept-uuid-456";

    const mockTopic: Topic = {
      id: topicId,
      name: "Software Architecture",
      code: "SWE_ARCH",
      description: "Software engineering design patterns and architecture",
      status: TopicStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockConcept: Concept = {
      id: conceptId,
      topicId: topicId,
      name: "Microservices",
      code: "MICROSERVICES",
      description: "Distributed system modular patterns",
      status: ConceptStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("1. Should create a Topic", async () => {
      topicRepoMock.findByCode.mockResolvedValue(null);
      topicRepoMock.create.mockResolvedValue(mockTopic);
      registryLoaderMock.loadTopics.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .post("/admin/topics")
        .send({
          name: "Software Architecture",
          code: "SWE_ARCH",
          description: "Software engineering design patterns and architecture",
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(topicId);
      expect(res.body.data.code).toBe("SWE_ARCH");
    });

    it("2. Should create a Concept under the topic", async () => {
      registryLoaderMock.getTopicById.mockResolvedValue({
        id: topicId,
        domain: "Software Engineering",
        topic: "Software Architecture",
        subtopic: "Architecture Design",
        concepts: [],
        tags: [],
        difficultySupport: { easy: true, medium: true, hard: true },
      });
      conceptRepoMock.findByTopicAndCode.mockResolvedValue(null);
      conceptRepoMock.create.mockResolvedValue(mockConcept);

      const res = await request(app.getHttpServer())
        .post(`/admin/topics/${topicId}/concepts`)
        .send({
          name: "Microservices",
          code: "MICROSERVICES",
          description: "Distributed system modular patterns",
          conceptName: "Microservices",
          conceptCode: "MICROSERVICES",
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(conceptId);
      expect(res.body.data.topicId).toBe(topicId);
    });

    it("3. Should update the Concept", async () => {
      conceptRepoMock.findById.mockResolvedValue(mockConcept);
      conceptRepoMock.update.mockResolvedValue({
        ...mockConcept,
        name: "Microservices Pattern",
      });

      const res = await request(app.getHttpServer())
        .patch(`/admin/concepts/${conceptId}`)
        .send({
          name: "Microservices Pattern",
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Microservices Pattern");
    });

    it("4. Should deactivate the Topic (soft delete)", async () => {
      topicRepoMock.findById.mockResolvedValue(mockTopic);
      topicRepoMock.delete.mockResolvedValue({
        ...mockTopic,
        status: TopicStatus.INACTIVE,
      });

      const res = await request(app.getHttpServer())
        .delete(`/admin/topics/${topicId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(topicRepoMock.delete).toHaveBeenCalledWith(topicId);
    });
  });
});
