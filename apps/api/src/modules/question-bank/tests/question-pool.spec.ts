import { BadRequestException, NotFoundException } from "@nestjs/common";
import { QuestionsController } from "../controllers/questions.controller";

describe("QuestionsController Unit Tests — Question Pool & Lifecycle", () => {
  let controller: QuestionsController;
  let prismaMock: any;
  let searchServiceMock: any;
  let templateServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      generatedQuestion: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      template: {
        count: jest.fn(),
      },
      concept: {
        count: jest.fn(),
        findFirst: jest.fn(),
      },
      topic: {
        findFirst: jest.fn(),
      },
      examSection: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      examConfig: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      question: {
        create: jest.fn(),
      },
    };

    searchServiceMock = {};
    templateServiceMock = {
      generateQuestionForTemplate: jest.fn(),
    };

    controller = new QuestionsController(
      searchServiceMock,
      prismaMock,
      templateServiceMock,
      undefined,
    );
  });

  describe("1. Question Validation Engine", () => {
    it("should pass validation with a correct question template structure", () => {
      const valid = (controller as any).validateQuestion({
        questionText: "What is the capital of France?",
        options: ["Paris", "London", "Berlin", "Rome"],
        correctAnswer: "Paris",
        solution: "Paris is the capital of France.",
        templateId: "template-1",
        conceptKey: "concept-1",
        difficultyLevel: "MEDIUM",
      });
      expect(valid.isValid).toBe(true);
      expect(valid.errors.length).toBe(0);
    });

    it("should reject if questionText is missing or empty", () => {
      const invalid = (controller as any).validateQuestion({
        options: ["Paris", "London"],
        correctAnswer: "Paris",
        solution: "Explanation",
        templateId: "t1",
        conceptKey: "c1",
        difficultyLevel: "MEDIUM",
      });
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors).toContain(
        "Question text exists validation failed: questionText is missing or empty",
      );
    });

    it("should reject if options contain duplicates", () => {
      const invalid = (controller as any).validateQuestion({
        questionText: "Which is a valid option?",
        options: ["Paris", "Paris", "London"],
        correctAnswer: "Paris",
        solution: "Explanation",
        templateId: "t1",
        conceptKey: "c1",
        difficultyLevel: "MEDIUM",
      });
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors).toContain(
        "Reject on duplicate options: options must be unique",
      );
    });

    it("should reject if correctAnswer is missing from options", () => {
      const invalid = (controller as any).validateQuestion({
        questionText: "Select correct answer",
        options: ["Paris", "London"],
        correctAnswer: "Berlin",
        solution: "Explanation",
        templateId: "t1",
        conceptKey: "c1",
        difficultyLevel: "MEDIUM",
      });
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors).toContain(
        "Exactly one correct answer validation failed: correctAnswer must match one of the options",
      );
    });
  });

  describe("2. Status Approval & Rejection Transitions", () => {
    it("should approve a generated question if validation checks pass", async () => {
      const mockQuestion = {
        id: "q-1",
        questionText: "Valid Question?",
        options: ["Yes", "No"],
        correctAnswer: "Yes",
        solution: "Correct explanation",
        templateId: "t-1",
        conceptKey: "c-1",
        difficultyLevel: "MEDIUM",
        metadata: { status: "GENERATED" },
      };

      prismaMock.generatedQuestion.findUnique.mockResolvedValue(mockQuestion);
      prismaMock.generatedQuestion.update.mockResolvedValue({
        ...mockQuestion,
        metadata: { status: "APPROVED" },
      });

      const res = await controller.approveQuestion("q-1");
      expect(res.success).toBe(true);
      expect(res.status).toBe("APPROVED");
      expect(prismaMock.generatedQuestion.update).toHaveBeenCalled();
    });

    it("should throw BadRequestException if approving an already published question", async () => {
      const mockQuestion = {
        id: "q-1",
        metadata: { status: "PUBLISHED" },
      };

      prismaMock.generatedQuestion.findUnique.mockResolvedValue(mockQuestion);

      await expect(controller.approveQuestion("q-1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should reject a generated question", async () => {
      const mockQuestion = {
        id: "q-1",
        metadata: { status: "GENERATED" },
      };

      prismaMock.generatedQuestion.findUnique.mockResolvedValue(mockQuestion);
      prismaMock.generatedQuestion.update.mockResolvedValue({
        ...mockQuestion,
        metadata: { status: "REJECTED" },
      });

      const res = await controller.rejectQuestion("q-1");
      expect(res.success).toBe(true);
      expect(res.status).toBe("REJECTED");
    });
  });

  describe("3. Publishing Flow", () => {
    it("should copy an approved question to main Question pool and set status PUBLISHED", async () => {
      const mockQuestion = {
        id: "q-approved",
        questionText: "Mock Question?",
        options: ["A", "B"],
        correctAnswer: "A",
        solution: "Explanation A",
        templateId: "template-a",
        conceptKey: "concept-a",
        difficultyLevel: "MEDIUM",
        metadata: {
          status: "APPROVED",
          _generationSeed: 123,
          _templateVersion: 1,
        },
      };

      prismaMock.generatedQuestion.findUnique.mockResolvedValue(mockQuestion);
      prismaMock.concept.findFirst.mockResolvedValue({ topicId: "topic-1" });
      prismaMock.examSection.findFirst.mockResolvedValue({ id: "section-1" });
      prismaMock.question.create.mockResolvedValue({ id: "main-q-1" });

      const res = await controller.publishQuestion("q-approved");
      expect(res.success).toBe(true);
      expect(res.status).toBe("PUBLISHED");
      expect(res.mainQuestionId).toBe("main-q-1");
      expect(prismaMock.question.create).toHaveBeenCalled();
      expect(prismaMock.generatedQuestion.update).toHaveBeenCalled();
    });
  });

  describe("4. Statistics Engine", () => {
    it("should dynamically calculate counts", async () => {
      prismaMock.generatedQuestion.findMany.mockResolvedValue([
        { metadata: { status: "APPROVED" } },
        { metadata: { status: "PUBLISHED" } },
        { metadata: { status: "REJECTED" } },
        { metadata: { status: "GENERATED" } },
      ]);
      prismaMock.template.count.mockResolvedValue(5);
      prismaMock.concept.count.mockResolvedValue(10);

      const stats = await controller.getStatistics();
      expect(stats.generated).toBe(4);
      expect(stats.approved).toBe(1);
      expect(stats.published).toBe(1);
      expect(stats.rejected).toBe(1);
      expect(stats.templates).toBe(5);
      expect(stats.concepts).toBe(10);
    });
  });
});
