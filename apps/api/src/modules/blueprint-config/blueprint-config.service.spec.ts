import { Test, TestingModule } from "@nestjs/testing";
import { BlueprintConfigService } from "./blueprint-config.service";
import { BlueprintValidatorService } from "./blueprint-validator.service";
import { BlueprintConfigRepository } from "./blueprint-config.repository";
import { BadRequestException } from "@nestjs/common";

describe("BlueprintConfigService", () => {
  let service: BlueprintConfigService;
  let repository: jest.Mocked<BlueprintConfigRepository>;

  beforeEach(async () => {
    const mockRepo = {
      findByCode: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findTopicConfigs: jest.fn(),
      addTopicConfig: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlueprintConfigService,
        BlueprintValidatorService,
        { provide: BlueprintConfigRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<BlueprintConfigService>(BlueprintConfigService);
    repository = module.get(BlueprintConfigRepository);
  });

  describe("create", () => {
    it("should create a new blueprint config", async () => {
      const dto = {
        name: "Test BP",
        code: "test",
        totalQuestions: 10,
        totalDurationMinutes: 30,
        isActive: true,
      };
      repository.findByCode.mockResolvedValue(null);
      repository.create.mockResolvedValue({ id: "bp-1", ...dto } as never);

      const result = await service.create(dto);
      expect(result.id).toEqual("bp-1");
    });

    it("should throw error if code exists", async () => {
      const dto = {
        name: "Test BP",
        code: "test",
        totalQuestions: 10,
        totalDurationMinutes: 30,
        isActive: true,
      };
      repository.findByCode.mockResolvedValue({ id: "existing" } as never);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("addTopicConfig", () => {
    it("should validate and add topic config", async () => {
      repository.findById.mockResolvedValue({
        id: "bp-1",
        totalQuestions: 10,
      } as never);
      repository.findTopicConfigs.mockResolvedValue([]);
      repository.addTopicConfig.mockResolvedValue({ id: "tc-1" } as never);

      const dto = {
        sectionId: "sec-1",
        topicId: "top-1",
        questionCount: 10,
        weightage: 100,
        easyCount: 3,
        mediumCount: 4,
        hardCount: 3,
      };

      const result = await service.addTopicConfig("bp-1", dto);
      expect(result.id).toEqual("tc-1");
    });

    it("should throw INVALID_DIFFICULTY_DISTRIBUTION if difficulty doesn't match", async () => {
      repository.findById.mockResolvedValue({
        id: "bp-1",
        totalQuestions: 10,
      } as never);
      repository.findTopicConfigs.mockResolvedValue([]);

      const dto = {
        sectionId: "sec-1",
        topicId: "top-1",
        questionCount: 10,
        weightage: 100,
        easyCount: 3,
        mediumCount: 3, // wrong, sum is 9
        hardCount: 3,
      };

      await expect(service.addTopicConfig("bp-1", dto)).rejects.toThrow(
        "INVALID_DIFFICULTY_DISTRIBUTION",
      );
    });
    it("should throw INVALID_QUESTION_DISTRIBUTION if question counts exceed blueprint total", async () => {
      repository.findById.mockResolvedValue({
        id: "bp-1",
        totalQuestions: 10,
      } as never);
      repository.findTopicConfigs.mockResolvedValue([
        { questionCount: 5, weightage: 50 } as never,
      ]);

      const dto = {
        sectionId: "sec-1",
        topicId: "top-1",
        questionCount: 6, // 5 + 6 = 11 > 10
        weightage: 50,
        easyCount: 2,
        mediumCount: 2,
        hardCount: 2,
      };

      await expect(service.addTopicConfig("bp-1", dto)).rejects.toThrow(
        "INVALID_QUESTION_DISTRIBUTION",
      );
    });

    it("should throw INVALID_WEIGHTAGE if weightage exceeds 100", async () => {
      repository.findById.mockResolvedValue({
        id: "bp-1",
        totalQuestions: 10,
      } as never);
      repository.findTopicConfigs.mockResolvedValue([
        { questionCount: 5, weightage: 60 } as never,
      ]);

      const dto = {
        sectionId: "sec-1",
        topicId: "top-1",
        questionCount: 5,
        weightage: 50, // 60 + 50 = 110 > 100
        easyCount: 2,
        mediumCount: 2,
        hardCount: 1,
      };

      await expect(service.addTopicConfig("bp-1", dto)).rejects.toThrow(
        "INVALID_WEIGHTAGE",
      );
    });
  });
});
