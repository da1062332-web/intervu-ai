/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from "@nestjs/testing";
import { TopicSectionMappingService } from "../services/topic-section-mapping.service";
import { TopicSectionMappingRepository } from "../repositories/topic-section-mapping.repository";
import { TopicRegistryLoader } from "../../concept-mapping/services/topic-registry-loader.service";
import { TopicRepository } from "../../concept-mapping/repositories/topic.repository";
import { ExamSectionRepository } from "../../admin-config/repositories/exam-section.repository";
import { ExamConfigRepository } from "../../admin-config/repositories/exam-config.repository";
import {
  TopicAlreadyMappedError,
  TopicNotFoundError,
  SectionTopicMappingNotFoundError,
  SectionNotFoundError,
} from "@intervu/shared";
import { BadRequestException } from "@nestjs/common";

describe("TopicSectionMappingService", () => {
  let service: TopicSectionMappingService;
  let repository: jest.Mocked<TopicSectionMappingRepository>;
  let registry: jest.Mocked<TopicRegistryLoader>;
  let topicRepo: jest.Mocked<TopicRepository>;
  let sectionRepo: jest.Mocked<ExamSectionRepository>;
  let configRepo: jest.Mocked<ExamConfigRepository>;

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
      loadTopics: jest.fn(),
    } as unknown as jest.Mocked<TopicRegistryLoader>;

    topicRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<TopicRepository>;

    sectionRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ExamSectionRepository>;

    configRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ExamConfigRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicSectionMappingService,
        { provide: TopicSectionMappingRepository, useValue: repository },
        { provide: TopicRegistryLoader, useValue: registry },
        { provide: TopicRepository, useValue: topicRepo },
        { provide: ExamSectionRepository, useValue: sectionRepo },
        { provide: ExamConfigRepository, useValue: configRepo },
      ],
    }).compile();

    service = module.get<TopicSectionMappingService>(
      TopicSectionMappingService,
    );
  });

  describe("validateSectionExists", () => {
    it("should throw SectionNotFoundError if section does not exist", async () => {
      sectionRepo.findById.mockResolvedValue(null);

      await expect(service.validateSectionExists("invalid")).rejects.toThrow(
        SectionNotFoundError,
      );
    });

    it("should throw BadRequestException if parent configuration is archived", async () => {
      sectionRepo.findById.mockResolvedValue({
        id: "section1",
        examConfigId: "config1",
      } as any);
      configRepo.findById.mockResolvedValue({
        id: "config1",
        isArchived: true,
        status: "ARCHIVED",
      } as any);

      await expect(service.validateSectionExists("section1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should pass validation if config is active", async () => {
      sectionRepo.findById.mockResolvedValue({
        id: "section1",
        examConfigId: "config1",
      } as any);
      configRepo.findById.mockResolvedValue({
        id: "config1",
        isArchived: false,
        status: "DRAFT",
      } as any);

      const section = await service.validateSectionExists("section1");
      expect(section).toBeDefined();
    });
  });

  describe("assignTopic", () => {
    it("should successfully assign a topic and reload registry", async () => {
      sectionRepo.findById.mockResolvedValue({
        id: "section1",
        examConfigId: "config1",
      } as any);
      configRepo.findById.mockResolvedValue({
        id: "config1",
        isArchived: false,
        status: "DRAFT",
      } as any);
      topicRepo.findById.mockResolvedValue({
        id: "topic1",
        isActive: true,
        deletedAt: null,
      } as any);
      repository.exists.mockResolvedValue(false);
      repository.createMapping.mockResolvedValue({
        id: "mapping-1",
        sectionId: "section1",
        topicId: "topic1",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await service.assignTopic("section1", "topic1");

      expect(repository.exists).toHaveBeenCalledWith("section1", "topic1");
      expect(repository.createMapping).toHaveBeenCalledWith(
        "section1",
        "topic1",
      );
      expect(registry.loadTopics).toHaveBeenCalled();
    });

    it("should throw TopicNotFoundError if topic does not exist in DB", async () => {
      sectionRepo.findById.mockResolvedValue({
        id: "section1",
        examConfigId: "config1",
      } as any);
      configRepo.findById.mockResolvedValue({
        id: "config1",
        isArchived: false,
        status: "DRAFT",
      } as any);
      topicRepo.findById.mockResolvedValue(null);

      await expect(service.assignTopic("section1", "invalid")).rejects.toThrow(
        TopicNotFoundError,
      );
    });

    it("should throw TopicAlreadyMappedError if topic is already assigned", async () => {
      sectionRepo.findById.mockResolvedValue({
        id: "section1",
        examConfigId: "config1",
      } as any);
      configRepo.findById.mockResolvedValue({
        id: "config1",
        isArchived: false,
        status: "DRAFT",
      } as any);
      topicRepo.findById.mockResolvedValue({
        id: "topic1",
        isActive: true,
        deletedAt: null,
      } as any);
      repository.exists.mockResolvedValue(true);

      await expect(service.assignTopic("section1", "topic1")).rejects.toThrow(
        TopicAlreadyMappedError,
      );
    });
  });

  describe("removeTopic", () => {
    it("should successfully remove a topic and reload registry", async () => {
      sectionRepo.findById.mockResolvedValue({
        id: "section1",
        examConfigId: "config1",
      } as any);
      configRepo.findById.mockResolvedValue({
        id: "config1",
        isArchived: false,
        status: "DRAFT",
      } as any);
      repository.exists.mockResolvedValue(true);
      repository.removeMapping.mockResolvedValue({
        id: "mapping-1",
        sectionId: "section1",
        topicId: "topic1",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await service.removeTopic("section1", "topic1");

      expect(repository.removeMapping).toHaveBeenCalledWith(
        "section1",
        "topic1",
      );
      expect(registry.loadTopics).toHaveBeenCalled();
    });

    it("should throw SectionTopicMappingNotFoundError if mapping doesn't exist", async () => {
      sectionRepo.findById.mockResolvedValue({
        id: "section1",
        examConfigId: "config1",
      } as any);
      configRepo.findById.mockResolvedValue({
        id: "config1",
        isArchived: false,
        status: "DRAFT",
      } as any);
      repository.exists.mockResolvedValue(false);

      await expect(service.removeTopic("section1", "topic1")).rejects.toThrow(
        SectionTopicMappingNotFoundError,
      );
    });
  });
});
