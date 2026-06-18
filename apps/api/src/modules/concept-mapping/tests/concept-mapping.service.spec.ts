import { Test, TestingModule } from "@nestjs/testing";
import { ConceptMappingService } from "../services/concept-mapping.service";
import { ConceptMappingRepository } from "../repositories/concept-mapping.repository";
import { TopicRegistryLoader } from "../services/topic-registry-loader.service";
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { ConceptMapping } from "@prisma/client";

describe("ConceptMappingService", () => {
  let service: ConceptMappingService;
  let repository: jest.Mocked<ConceptMappingRepository>;
  let registryLoader: jest.Mocked<TopicRegistryLoader>;

  const mockTopicItem = {
    id: "se-ds-001",
    domain: "Software Engineering",
    topic: "Data Structures",
    subtopic: "Arrays & Hashing",
    concepts: ["Traversal", "Prefix Sum"],
    tags: ["arrays"],
    difficultySupport: { easy: true, medium: true, hard: false },
  };

  const mockConcept: ConceptMapping = {
    id: "concept-123",
    topicId: "se-ds-001",
    conceptName: "Prefix Sum",
    conceptCode: "PREFIX_SUM",
    description: "Prefix Sum array operations",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConceptMappingService,
        { provide: ConceptMappingRepository, useValue: mockRepo },
        { provide: TopicRegistryLoader, useValue: mockLoader },
      ],
    }).compile();

    service = module.get<ConceptMappingService>(ConceptMappingService);
    repository = module.get(ConceptMappingRepository);
    registryLoader = module.get(TopicRegistryLoader);
  });

  describe("createConcept", () => {
    it("should create a concept mapping successfully", async () => {
      registryLoader.getTopicById.mockResolvedValue(mockTopicItem);
      repository.findByTopicAndCode.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockConcept);

      const dto = {
        conceptName: "Prefix Sum",
        conceptCode: "PREFIX_SUM",
        description: "Prefix Sum array operations",
      };

      const result = await service.createConcept("se-ds-001", dto);

      expect(registryLoader.getTopicById).toHaveBeenCalledWith("se-ds-001");
      expect(repository.findByTopicAndCode).toHaveBeenCalledWith(
        "se-ds-001",
        "PREFIX_SUM",
      );
      expect(repository.create).toHaveBeenCalledWith({
        conceptName: "Prefix Sum",
        conceptCode: "PREFIX_SUM",
        description: "Prefix Sum array operations",
        topicId: "se-ds-001",
      });
      expect(result).toEqual(mockConcept);
    });

    it("should throw BadRequestException if topicId does not exist in registry", async () => {
      registryLoader.getTopicById.mockResolvedValue(null);

      const dto = {
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
        conceptName: "New Name",
      });

      const dto = { conceptName: "New Name" };
      const result = await service.updateConcept("concept-123", dto);

      expect(repository.findById).toHaveBeenCalledWith("concept-123");
      expect(repository.update).toHaveBeenCalledWith("concept-123", dto);
      expect(result.conceptName).toBe("New Name");
    });

    it("should throw NotFoundException if concept mapping is not found", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.updateConcept("invalid-id", { conceptName: "Test" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should validate and throw ConflictException if conceptCode is updated to a duplicate", async () => {
      repository.findById.mockResolvedValue(mockConcept);
      repository.findByTopicAndCode.mockResolvedValue({
        ...mockConcept,
        id: "other-id",
      });

      const dto = { conceptCode: "DUPLICATE_CODE" };

      await expect(service.updateConcept("concept-123", dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("deleteConcept", () => {
    it("should call delete in repository", async () => {
      repository.findById.mockResolvedValue(mockConcept);
      repository.delete.mockResolvedValue({ ...mockConcept, isActive: false });

      const result = await service.deleteConcept("concept-123");

      expect(repository.findById).toHaveBeenCalledWith("concept-123");
      expect(repository.delete).toHaveBeenCalledWith("concept-123");
      expect(result.isActive).toBe(false);
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
