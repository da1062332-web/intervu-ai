import { Test, TestingModule } from "@nestjs/testing";
import { ConceptMappingService } from "../services/concept-mapping.service";
import { ConceptMappingRepository } from "../repositories/concept-mapping.repository";
import { TopicRegistryLoader } from "../services/topic-registry-loader.service";
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Concept, ConceptStatus } from "@prisma/client";

import { PrismaService } from "../../../prisma/prisma.service";

describe("ConceptMappingService", () => {
  let service: ConceptMappingService;
  let repository: jest.Mocked<ConceptMappingRepository>;
  let registryLoader: jest.Mocked<TopicRegistryLoader>;
  let prisma: any;

  const mockTopicItem = {
    id: "se-ds-001",
    domain: "Software Engineering",
    topic: "Data Structures",
    subtopic: "Arrays & Hashing",
    concepts: ["Traversal", "Prefix Sum"],
    tags: ["arrays"],
    difficultySupport: { easy: true, medium: true, hard: false },
  };

  const mockConcept: Concept = {
    id: "concept-123",
    topicId: "se-ds-001",
    name: "Prefix Sum",
    code: "PREFIX_SUM",
    description: "Prefix Sum array operations",
    status: ConceptStatus.ACTIVE,
    questionSources: ["VARIABLE_TEMPLATE"],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findManyByTopicId: jest.fn(),
      findByTopicAndCode: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockLoader = {
      getTopicById: jest.fn(),
      loadTopics: jest.fn(),
      getAllTopics: jest.fn(),
    };

    const mockPrisma = {
      template: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      generatedQuestion: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConceptMappingService,
        { provide: ConceptMappingRepository, useValue: mockRepo },
        { provide: TopicRegistryLoader, useValue: mockLoader },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ConceptMappingService>(ConceptMappingService);
    repository = module.get(ConceptMappingRepository);
    registryLoader = module.get(TopicRegistryLoader);
    prisma = module.get(PrismaService);
  });

  describe("createConcept", () => {
    it("should create a concept mapping successfully", async () => {
      registryLoader.getTopicById.mockResolvedValue(mockTopicItem);
      repository.findByTopicAndCode.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockConcept);

      const dto = {
        name: "Prefix Sum",
        code: "PREFIX_SUM",
        description: "Prefix Sum array operations",
        conceptName: "Prefix Sum",
        conceptCode: "PREFIX_SUM",
      };

      const result = await service.createConcept("se-ds-001", dto);

      expect(registryLoader.getTopicById).toHaveBeenCalledWith("se-ds-001");
      expect(repository.findByTopicAndCode).toHaveBeenCalledWith(
        "se-ds-001",
        "PREFIX_SUM",
      );
      expect(repository.create).toHaveBeenCalledWith({
        name: "Prefix Sum",
        code: "PREFIX_SUM",
        description: "Prefix Sum array operations",
        status: ConceptStatus.ACTIVE,
        topicId: "se-ds-001",
      });
      expect(result).toEqual(mockConcept);
    });

    it("should throw BadRequestException if topicId does not exist in registry", async () => {
      registryLoader.getTopicById.mockResolvedValue(null);

      const dto = {
        name: "Prefix Sum",
        code: "PREFIX_SUM",
        conceptName: "Prefix Sum",
        conceptCode: "PREFIX_SUM",
      };

      await expect(service.createConcept("invalid-topic", dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw ConflictException if conceptCode already exists in topic", async () => {
      registryLoader.getTopicById.mockResolvedValue(mockTopicItem);
      repository.findByTopicAndCode.mockResolvedValue(mockConcept);

      const dto = {
        name: "Prefix Sum",
        code: "PREFIX_SUM",
        conceptName: "Prefix Sum",
        conceptCode: "PREFIX_SUM",
      };

      await expect(service.createConcept("se-ds-001", dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("getConcepts", () => {
    it("should return list of concepts for a valid topicId", async () => {
      registryLoader.getTopicById.mockResolvedValue(mockTopicItem);
      repository.findManyByTopicId.mockResolvedValue([mockConcept]);

      const result = await service.getConcepts("se-ds-001", true);

      expect(registryLoader.getTopicById).toHaveBeenCalledWith("se-ds-001");
      expect(repository.findManyByTopicId).toHaveBeenCalledWith(
        "se-ds-001",
        true,
      );
      expect(result).toEqual([mockConcept]);
    });

    it("should throw BadRequestException if topicId does not exist in registry", async () => {
      registryLoader.getTopicById.mockResolvedValue(null);

      await expect(service.getConcepts("invalid-topic", true)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("updateConcept", () => {
    it("should update concept mapping details successfully", async () => {
      repository.findById.mockResolvedValue(mockConcept);
      repository.update.mockResolvedValue({
        ...mockConcept,
        name: "New Name",
      });

      const dto = { name: "New Name" };
      const result = await service.updateConcept("concept-123", dto);

      expect(repository.findById).toHaveBeenCalledWith("concept-123");
      expect(repository.update).toHaveBeenCalledWith("concept-123", {
        name: "New Name",
        code: undefined,
        description: undefined,
        status: undefined,
      });
      expect(result.name).toBe("New Name");
    });

    it("should throw NotFoundException if concept mapping is not found", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.updateConcept("invalid-id", { name: "Test" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should validate and throw ConflictException if conceptCode is updated to a duplicate", async () => {
      repository.findById.mockResolvedValue(mockConcept);
      repository.findByTopicAndCode.mockResolvedValue({
        ...mockConcept,
        id: "other-id",
      });

      const dto = { code: "DUPLICATE_CODE" };

      await expect(service.updateConcept("concept-123", dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("deleteConcept", () => {
    it("should call delete in repository if not linked to templates or questions", async () => {
      repository.findById.mockResolvedValue(mockConcept);
      prisma.template.findMany.mockResolvedValue([]);
      prisma.generatedQuestion.findMany.mockResolvedValue([]);
      repository.delete.mockResolvedValue({
        ...mockConcept,
        status: ConceptStatus.INACTIVE,
      });

      const result = await service.deleteConcept("concept-123");

      expect(repository.findById).toHaveBeenCalledWith("concept-123");
      expect(prisma.template.findMany).toHaveBeenCalled();
      expect(prisma.generatedQuestion.findMany).toHaveBeenCalled();
      expect(repository.delete).toHaveBeenCalledWith("concept-123");
      expect(result.status).toBe(ConceptStatus.INACTIVE);
    });

    it("should throw BadRequestException if concept to delete is linked to active templates", async () => {
      repository.findById.mockResolvedValue(mockConcept);
      prisma.template.findMany.mockResolvedValue([
        { id: "template-1", name: "Linked Template" },
      ]);
      prisma.generatedQuestion.findMany.mockResolvedValue([]);

      await expect(service.deleteConcept("concept-123")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException if concept to delete is linked to generated questions", async () => {
      repository.findById.mockResolvedValue(mockConcept);
      prisma.template.findMany.mockResolvedValue([]);
      prisma.generatedQuestion.findMany.mockResolvedValue([{ id: "question-1" }]);

      await expect(service.deleteConcept("concept-123")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw NotFoundException if concept to delete is not found", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.deleteConcept("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getAllTopics", () => {
    it("should return list of topics from registry loader", async () => {
      registryLoader.getAllTopics.mockResolvedValue([mockTopicItem]);

      const result = await service.getAllTopics();

      expect(registryLoader.getAllTopics).toHaveBeenCalled();
      expect(result).toEqual([mockTopicItem]);
    });
  });
});
