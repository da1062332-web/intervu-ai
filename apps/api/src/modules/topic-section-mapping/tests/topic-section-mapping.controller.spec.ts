import { Test, TestingModule } from "@nestjs/testing";
import { TopicSectionMappingController } from "../controllers/topic-section-mapping.controller";
import { TopicSectionMappingService } from "../services/topic-section-mapping.service";

describe("TopicSectionMappingController", () => {
  let controller: TopicSectionMappingController;
  let service: jest.Mocked<TopicSectionMappingService>;

  beforeEach(async () => {
    service = {
      getMappings: jest.fn(),
      assignTopic: jest.fn(),
      removeTopic: jest.fn(),
    } as unknown as jest.Mocked<TopicSectionMappingService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TopicSectionMappingController],
      providers: [{ provide: TopicSectionMappingService, useValue: service }],
    }).compile();

    controller = module.get<TopicSectionMappingController>(
      TopicSectionMappingController,
    );
  });

  describe("getMappings", () => {
    it("should return list of mappings", async () => {
      service.getMappings.mockResolvedValue([
        { topicId: "1", topicName: "Test", topicCode: "T" },
      ]);
      const result = await controller.getMappings("section1");
      expect(result).toEqual({
        success: true,
        data: [{ topicId: "1", topicName: "Test", topicCode: "T" }],
      });
    });
  });

  describe("assignTopic", () => {
    it("should call assignTopic service method", async () => {
      await controller.assignTopic("section1", { topicId: "topic1" });
      expect(service.assignTopic).toHaveBeenCalledWith("section1", "topic1");
    });
  });

  describe("removeTopic", () => {
    it("should call removeTopic service method", async () => {
      await controller.removeTopic("section1", "topic1");
      expect(service.removeTopic).toHaveBeenCalledWith("section1", "topic1");
    });
  });
});
