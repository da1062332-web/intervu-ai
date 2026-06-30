 
import { Test, TestingModule } from "@nestjs/testing";
import { TopicWeightageController } from "../controllers/topic-weightage.controller";
import { TopicWeightageService } from "../services/topic-weightage.service";
import {
  CreateTopicWeightageDto,
  UpdateTopicWeightageDto,
} from "@intervu/shared";

describe("TopicWeightageController", () => {
  let controller: TopicWeightageController;
  let service: jest.Mocked<TopicWeightageService>;

  beforeEach(async () => {
    service = {
      addWeightage: jest.fn(),
      getWeightages: jest.fn(),
      updateWeightage: jest.fn(),
      deleteWeightage: jest.fn(),
      validateSectionTotalWeightage: jest.fn(),
    } as unknown as jest.Mocked<TopicWeightageService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TopicWeightageController],
      providers: [{ provide: TopicWeightageService, useValue: service }],
    }).compile();

    controller = module.get<TopicWeightageController>(TopicWeightageController);
  });

  describe("addWeightage", () => {
    it("should successfully call service.addWeightage", async () => {
      const dto: CreateTopicWeightageDto = {
        topicId: "topic1",
        weightagePercentage: 40,
      };
      service.addWeightage.mockResolvedValue({ id: "w1", ...dto } as any);

      const result = await controller.addWeightage("section1", dto);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(service.addWeightage).toHaveBeenCalledWith(
        "section1",
        "topic1",
        40,
      );
    });
  });

  describe("getWeightages", () => {
    it("should successfully call service.getWeightages", async () => {
      service.getWeightages.mockResolvedValue([]);

      const result = await controller.getWeightages("section1");

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(service.getWeightages).toHaveBeenCalledWith("section1");
    });
  });

  describe("updateWeightage", () => {
    it("should successfully call service.updateWeightage", async () => {
      const dto: UpdateTopicWeightageDto = {
        weightagePercentage: 60,
      };
      service.updateWeightage.mockResolvedValue({
        id: "w1",
        weightagePercentage: 60,
      } as any);

      const result = await controller.updateWeightage("w1", dto);

      expect(result.success).toBe(true);
      expect(result.data.weightagePercentage).toBe(60);
      expect(service.updateWeightage).toHaveBeenCalledWith("w1", 60);
    });
  });

  describe("deleteWeightage", () => {
    it("should successfully call service.deleteWeightage", async () => {
      service.deleteWeightage.mockResolvedValue(undefined);

      const result = await controller.deleteWeightage("w1");

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(service.deleteWeightage).toHaveBeenCalledWith("w1");
    });
  });
});
