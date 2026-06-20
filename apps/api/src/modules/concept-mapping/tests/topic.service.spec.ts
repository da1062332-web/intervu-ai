import { Test, TestingModule } from "@nestjs/testing";
import { TopicService } from "../services/topic.service";
import { TopicRepository } from "../repositories/topic.repository";
import { TopicRegistryLoader } from "../services/topic-registry-loader.service";
import { NotFoundException } from "@nestjs/common";
import { Topic, TopicStatus } from "@prisma/client";

describe("TopicService", () => {
  let service: TopicService;
  let repository: jest.Mocked<TopicRepository>;
  let registryLoader: jest.Mocked<TopicRegistryLoader>;

  const mockTopic: Topic = {
    id: "topic-123",
    name: "Data Structures",
    code: "DATA_STRUCTURES",
    description: "Software Engineering - Arrays & Hashing",
    status: TopicStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    findManyActive: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockLoader = {
    loadTopics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicService,
        { provide: TopicRepository, useValue: mockRepository },
        { provide: TopicRegistryLoader, useValue: mockLoader },
      ],
    }).compile();

    service = module.get<TopicService>(TopicService);
    repository = module.get(TopicRepository);
    registryLoader = module.get(TopicRegistryLoader);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createTopic", () => {
    it("should create a topic and refresh cache", async () => {
      repository.findByCode.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockTopic);
      registryLoader.loadTopics.mockResolvedValue([]);

      const dto = {
        name: "Data Structures",
        code: "DATA_STRUCTURES",
        description: "Software Engineering - Arrays & Hashing",
      };

      const result = await service.createTopic(dto);

      expect(repository.create).toHaveBeenCalledWith({
        name: dto.name,
        code: dto.code.toUpperCase(),
        description: dto.description,
        status: TopicStatus.ACTIVE,
      });
      expect(registryLoader.loadTopics).toHaveBeenCalled();
      expect(result).toEqual(mockTopic);
    });
  });

  describe("getTopics", () => {
    it("should list active topics", async () => {
      repository.findManyActive.mockResolvedValue([mockTopic]);

      const result = await service.getTopics(true);

      expect(repository.findManyActive).toHaveBeenCalledWith(true);
      expect(result).toEqual([mockTopic]);
    });
  });

  describe("getTopic", () => {
    it("should return a topic if found", async () => {
      repository.findById.mockResolvedValue(mockTopic);

      const result = await service.getTopic("topic-123");

      expect(repository.findById).toHaveBeenCalledWith("topic-123");
      expect(result).toEqual(mockTopic);
    });

    it("should throw NotFoundException if topic not found or deleted", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getTopic("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateTopic", () => {
    it("should update and refresh cache", async () => {
      repository.findById.mockResolvedValue(mockTopic);
      repository.update.mockResolvedValue({
        ...mockTopic,
        name: "New Name",
      });
      registryLoader.loadTopics.mockResolvedValue([]);

      const dto = { name: "New Name" };
      const result = await service.updateTopic("topic-123", dto);

      expect(repository.findById).toHaveBeenCalledWith("topic-123");
      expect(repository.update).toHaveBeenCalledWith("topic-123", {
        name: "New Name",
        code: undefined,
        description: undefined,
        status: undefined,
      });
      expect(registryLoader.loadTopics).toHaveBeenCalled();
      expect(result.name).toBe("New Name");
    });
  });

  describe("deleteTopic", () => {
    it("should delete (deactivate) topic and refresh cache", async () => {
      repository.findById.mockResolvedValue(mockTopic);
      repository.delete.mockResolvedValue({ ...mockTopic, status: TopicStatus.INACTIVE });
      registryLoader.loadTopics.mockResolvedValue([]);

      const result = await service.deleteTopic("topic-123");

      expect(repository.findById).toHaveBeenCalledWith("topic-123");
      expect(repository.delete).toHaveBeenCalledWith("topic-123");
      expect(registryLoader.loadTopics).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });
});
