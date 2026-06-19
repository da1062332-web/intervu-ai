import { Test, TestingModule } from "@nestjs/testing";
import { TopicController } from "../controllers/topic.controller";
import { TopicService } from "../services/topic.service";
import { CreateTopicDto, UpdateTopicDto } from "@intervu/shared";
import { Topic } from "@prisma/client";

describe("TopicController", () => {
  let controller: TopicController;
  let service: jest.Mocked<TopicService>;

  const mockTopic: Topic = {
    id: "topic-123",
    domain: "Software Engineering",
    topicName: "Data Structures",
    subtopic: "Arrays & Hashing",
    tags: ["arrays"],
    easySupport: true,
    mediumSupport: true,
    hardSupport: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockService = {
    createTopic: jest.fn(),
    getTopics: jest.fn(),
    getTopic: jest.fn(),
    updateTopic: jest.fn(),
    deleteTopic: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TopicController],
      providers: [{ provide: TopicService, useValue: mockService }],
    }).compile();

    controller = module.get<TopicController>(TopicController);
    service = module.get(TopicService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createTopic", () => {
    it("should call service createTopic", async () => {
      const dto: CreateTopicDto = {
        domain: "Software Engineering",
        topicName: "Data Structures",
        subtopic: "Arrays & Hashing",
        tags: ["arrays"],
        easySupport: true,
        mediumSupport: true,
        hardSupport: false,
      };
      service.createTopic.mockResolvedValue(mockTopic);

      const result = await controller.createTopic(dto);

      expect(service.createTopic).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTopic);
    });
  });

  describe("getTopics", () => {
    it("should call service getTopics", async () => {
      service.getTopics.mockResolvedValue([mockTopic]);

      const result = await controller.getTopics("true");

      expect(service.getTopics).toHaveBeenCalledWith(true);
      expect(result).toEqual([mockTopic]);
    });
  });

  describe("getTopic", () => {
    it("should call service getTopic", async () => {
      service.getTopic.mockResolvedValue(mockTopic);

      const result = await controller.getTopic("topic-123");

      expect(service.getTopic).toHaveBeenCalledWith("topic-123");
      expect(result).toEqual(mockTopic);
    });
  });

  describe("updateTopic", () => {
    it("should call service updateTopic", async () => {
      const dto: UpdateTopicDto = { topicName: "New Name" };
      service.updateTopic.mockResolvedValue({
        ...mockTopic,
        topicName: "New Name",
      });

      const result = await controller.updateTopic("topic-123", dto);

      expect(service.updateTopic).toHaveBeenCalledWith("topic-123", dto);
      expect(result.topicName).toBe("New Name");
    });
  });

  describe("deleteTopic", () => {
    it("should call service deleteTopic", async () => {
      service.deleteTopic.mockResolvedValue({ success: true });

      const result = await controller.deleteTopic("topic-123");

      expect(service.deleteTopic).toHaveBeenCalledWith("topic-123");
      expect(result).toEqual({ success: true });
    });
  });
});
