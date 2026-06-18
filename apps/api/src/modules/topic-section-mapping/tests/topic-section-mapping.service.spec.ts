import { Test, TestingModule } from "@nestjs/testing";
import { TopicSectionMappingService } from "../services/topic-section-mapping.service";
import { TopicSectionMappingRepository } from "../repositories/topic-section-mapping.repository";
import { TopicRegistryLoader } from "../../concept-mapping/services/topic-registry-loader.service";
import {
  TopicAlreadyMappedError,
  TopicNotFoundError,
  SectionTopicMappingNotFoundError,
} from "@intervu/shared";

describe("TopicSectionMappingService", () => {
  let service: TopicSectionMappingService;
  let repository: jest.Mocked<TopicSectionMappingRepository>;
  let registry: jest.Mocked<TopicRegistryLoader>;

  beforeEach(async () => {
    repository = {
      createMapping: jest.fn(),
      removeMapping: jest.fn(),
      findMappingsBySection: jest.fn(),
      findMapping: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<TopicSectionMappingRepository>;

    registry = {
      getTopicById: jest.fn(),
    } as unknown as jest.Mocked<TopicRegistryLoader>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicSectionMappingService,
        { provide: TopicSectionMappingRepository, useValue: repository },
        { provide: TopicRegistryLoader, useValue: registry },
      ],
    }).compile();

    service = module.get<TopicSectionMappingService>(
      TopicSectionMappingService,
    );
  });

  describe("assignTopic", () => {
    it("should successfully assign a topic", async () => {
      registry.getTopicById.mockResolvedValue({
        id: "topic1",
        topic: "React",
        subtopic: "Hooks",
        domain: "FE",
        concepts: [],
        tags: [],
        difficultySupport: { easy: true, medium: true, hard: true },
      });
      repository.exists.mockResolvedValue(false);
      repository.createMapping.mockResolvedValue({
        id: "mapping-1",
        sectionId: "section1",
        topicId: "topic1",
        createdAt: new Date(),
      });

      await service.assignTopic("section1", "topic1");

      expect(repository.exists).toHaveBeenCalledWith("section1", "topic1");
      expect(repository.createMapping).toHaveBeenCalledWith(
        "section1",
        "topic1",
      );
    });

    it("should throw TopicNotFoundError if topic does not exist in registry", async () => {
      registry.getTopicById.mockResolvedValue(null);

      await expect(service.assignTopic("section1", "invalid")).rejects.toThrow(
        TopicNotFoundError,
      );
    });

    it("should throw TopicAlreadyMappedError if topic is already assigned", async () => {
      registry.getTopicById.mockResolvedValue({
        id: "topic1",
        topic: "React",
        subtopic: "Hooks",
        domain: "FE",
        concepts: [],
        tags: [],
        difficultySupport: { easy: true, medium: true, hard: true },
      });
      repository.exists.mockResolvedValue(true);

      await expect(service.assignTopic("section1", "topic1")).rejects.toThrow(
        TopicAlreadyMappedError,
      );
    });
  });

  describe("removeTopic", () => {
    it("should successfully remove a topic", async () => {
      repository.exists.mockResolvedValue(true);
      repository.removeMapping.mockResolvedValue({
        id: "mapping-1",
        sectionId: "section1",
        topicId: "topic1",
        createdAt: new Date(),
      });

      await service.removeTopic("section1", "topic1");

      expect(repository.removeMapping).toHaveBeenCalledWith(
        "section1",
        "topic1",
      );
    });

    it("should throw SectionTopicMappingNotFoundError if mapping doesn't exist", async () => {
      repository.exists.mockResolvedValue(false);

      await expect(service.removeTopic("section1", "topic1")).rejects.toThrow(
        SectionTopicMappingNotFoundError,
      );
    });
  });
});
