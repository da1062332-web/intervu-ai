import { Test, TestingModule } from "@nestjs/testing";
import { TopicWeightageService } from "../services/topic-weightage.service";
import { TopicWeightageRepository } from "../repositories/topic-weightage.repository";
import { TopicSectionMappingRepository } from "../repositories/topic-section-mapping.repository";
import { ExamSectionRepository } from "../../admin-config/repositories/exam-section.repository";
import { ExamConfigRepository } from "../../admin-config/repositories/exam-config.repository";
import {
  WeightageNotFoundError,
  WeightageTotalExceededError,
  WeightageTotalInvalidError,
  TopicNotMappedToSectionError,
} from "@intervu/shared";
import { ConflictException } from "@nestjs/common";

describe("TopicWeightageService", () => {
  let service: TopicWeightageService;
  let repository: jest.Mocked<TopicWeightageRepository>;
  let mappingRepository: jest.Mocked<TopicSectionMappingRepository>;
  let sectionRepo: jest.Mocked<ExamSectionRepository>;
  let configRepo: jest.Mocked<ExamConfigRepository>;

  beforeEach(async () => {
    repository = {
      createWeightage: jest.fn(),
      findWeightageById: jest.fn(),
      findWeightagesBySection: jest.fn(),
      findWeightageBySectionAndTopic: jest.fn(),
      updateWeightage: jest.fn(),
      deleteWeightage: jest.fn(),
      sumWeightagesBySection: jest.fn(),
    } as unknown as jest.Mocked<TopicWeightageRepository>;

    mappingRepository = {
      exists: jest.fn(),
    } as unknown as jest.Mocked<TopicSectionMappingRepository>;

    sectionRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ExamSectionRepository>;

    configRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ExamConfigRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicWeightageService,
        { provide: TopicWeightageRepository, useValue: repository },
        { provide: TopicSectionMappingRepository, useValue: mappingRepository },
        { provide: ExamSectionRepository, useValue: sectionRepo },
        { provide: ExamConfigRepository, useValue: configRepo },
      ],
    }).compile();

    service = module.get<TopicWeightageService>(TopicWeightageService);
  });

  describe("addWeightage", () => {
    it("should successfully assign weightage if constraints pass", async () => {
      sectionRepo.findById.mockResolvedValue({
        id: "section1",
        examConfigId: "config1",
      } as any);
      configRepo.findById.mockResolvedValue({
        id: "config1",
        isArchived: false,
        status: "DRAFT",
      } as any);
      mappingRepository.exists.mockResolvedValue(true);
      repository.findWeightageBySectionAndTopic.mockResolvedValue(null);
      repository.sumWeightagesBySection.mockResolvedValue(40);
      repository.createWeightage.mockResolvedValue({
        id: "weightage1",
        sectionId: "section1",
        topicId: "topic1",
        weightagePercentage: 30,
      } as any);

      const result = await service.addWeightage("section1", "topic1", 30);

      expect(result).toBeDefined();
      expect(repository.createWeightage).toHaveBeenCalledWith(
        "section1",
        "topic1",
        30,
      );
    });

    it("should throw TopicNotMappedToSectionError if topic is not mapped to section", async () => {
      sectionRepo.findById.mockResolvedValue({
        id: "section1",
        examConfigId: "config1",
      } as any);
      configRepo.findById.mockResolvedValue({
        id: "config1",
        isArchived: false,
        status: "DRAFT",
      } as any);
      mappingRepository.exists.mockResolvedValue(false);

      await expect(
        service.addWeightage("section1", "topic1", 30),
      ).rejects.toThrow(TopicNotMappedToSectionError);
    });

    it("should throw ConflictException if weightage already exists", async () => {
      sectionRepo.findById.mockResolvedValue({
        id: "section1",
        examConfigId: "config1",
      } as any);
      configRepo.findById.mockResolvedValue({
        id: "config1",
        isArchived: false,
        status: "DRAFT",
      } as any);
      mappingRepository.exists.mockResolvedValue(true);
      repository.findWeightageBySectionAndTopic.mockResolvedValue({
        id: "w1",
      } as any);

      await expect(
        service.addWeightage("section1", "topic1", 30),
      ).rejects.toThrow(ConflictException);
    });

    it("should throw WeightageTotalExceededError if sum exceeds 100%", async () => {
      sectionRepo.findById.mockResolvedValue({
        id: "section1",
        examConfigId: "config1",
      } as any);
      configRepo.findById.mockResolvedValue({
        id: "config1",
        isArchived: false,
        status: "DRAFT",
      } as any);
      mappingRepository.exists.mockResolvedValue(true);
      repository.findWeightageBySectionAndTopic.mockResolvedValue(null);
      repository.sumWeightagesBySection.mockResolvedValue(80);

      await expect(
        service.addWeightage("section1", "topic1", 30),
      ).rejects.toThrow(WeightageTotalExceededError);
    });
  });

  describe("updateWeightage", () => {
    it("should successfully update weightage", async () => {
      repository.findWeightageById.mockResolvedValue({
        id: "weightage1",
        sectionId: "section1",
        topicId: "topic1",
        weightagePercentage: 30,
      } as any);
      sectionRepo.findById.mockResolvedValue({
        id: "section1",
        examConfigId: "config1",
      } as any);
      configRepo.findById.mockResolvedValue({
        id: "config1",
        isArchived: false,
        status: "DRAFT",
      } as any);
      repository.sumWeightagesBySection.mockResolvedValue(30);
      repository.updateWeightage.mockResolvedValue({
        id: "weightage1",
        weightagePercentage: 50,
      } as any);

      const result = await service.updateWeightage("weightage1", 50);

      expect(result).toBeDefined();
      expect(repository.updateWeightage).toHaveBeenCalledWith("weightage1", 50);
    });

    it("should throw WeightageNotFoundError if config is not found", async () => {
      repository.findWeightageById.mockResolvedValue(null);

      await expect(service.updateWeightage("invalid", 50)).rejects.toThrow(
        WeightageNotFoundError,
      );
    });
  });

  describe("validateSectionTotalWeightage", () => {
    it("should throw WeightageTotalInvalidError if total is not 100", async () => {
      repository.sumWeightagesBySection.mockResolvedValue(80);

      await expect(
        service.validateSectionTotalWeightage("section1"),
      ).rejects.toThrow(WeightageTotalInvalidError);
    });

    it("should pass silently if total is exactly 100", async () => {
      repository.sumWeightagesBySection.mockResolvedValue(100);

      await expect(
        service.validateSectionTotalWeightage("section1"),
      ).resolves.not.toThrow();
    });
  });
});
