import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuestionReservationService } from "../services/question-reservation.service";
import { QuestionRotationService } from "../services/question-rotation.service";
import { QuestionUsageService } from "../services/question-usage.service";

describe("Question Bank Module - Day 3 Assembly Integration", () => {
  let rotationService: QuestionRotationService;
  let usageService: QuestionUsageService;

  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      question: {
        count: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        groupBy: jest.fn(),
      },
      questionReservation: {
        create: jest.fn(),
        createMany: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      questionUsage: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaMock)),
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionReservationService,
        QuestionRotationService,
        QuestionUsageService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    rotationService = module.get<QuestionRotationService>(
      QuestionRotationService,
    );
    usageService = module.get<QuestionUsageService>(QuestionUsageService);
  });

  describe("1. Blueprint Request Validation", () => {
    it("should pass validation when count matches sum of difficulty distribution", () => {
      const request = {
        examId: "exam-1",
        sectionId: "sec-1",
        count: 10,
        difficultyDistribution: {
          EASY: 3,
          MEDIUM: 5,
          HARD: 2,
        },
      };
      expect(() => rotationService.validateRequest(request)).not.toThrow();
    });

    it("should throw BadRequestException when count does not match difficulty distribution", () => {
      const request = {
        examId: "exam-1",
        sectionId: "sec-1",
        count: 10,
        difficultyDistribution: {
          EASY: 5,
          MEDIUM: 5,
          HARD: 2, // Sum is 12
        },
      };
      expect(() => rotationService.validateRequest(request)).toThrow(
        BadRequestException,
      );
    });
  });

  describe("2. Availability Engine", () => {
    it("should report AVAILABLE when pool has enough questions", async () => {
      prismaMock.question.count
        .mockResolvedValueOnce(5) // EASY
        .mockResolvedValueOnce(5); // MEDIUM

      const request = {
        examId: "exam-1",
        sectionId: "sec-1",
        count: 6,
        difficultyDistribution: {
          EASY: 3,
          MEDIUM: 3,
        },
      };

      const result = await rotationService.checkAvailability(request);

      expect(result.status).toBe("AVAILABLE");
      expect(result.required).toBe(6);
      expect(result.available).toBe(6);
      expect(result.missing).toBe(0);
      expect(result.details).toContainEqual({
        difficulty: "EASY",
        required: 3,
        available: 5,
        missing: 0,
      });
    });

    it("should report INSUFFICIENT_POOL when pool is short of questions", async () => {
      prismaMock.question.count
        .mockResolvedValueOnce(2) // EASY (need 3)
        .mockResolvedValueOnce(4); // MEDIUM (need 3)

      const request = {
        examId: "exam-1",
        sectionId: "sec-1",
        count: 6,
        difficultyDistribution: {
          EASY: 3,
          MEDIUM: 3,
        },
      };

      const result = await rotationService.checkAvailability(request);

      expect(result.status).toBe("INSUFFICIENT_POOL");
      expect(result.required).toBe(6);
      expect(result.available).toBe(5); // 2 easy + 3 medium (max needed)
      expect(result.missing).toBe(1);
      expect(result.details).toContainEqual({
        difficulty: "EASY",
        required: 3,
        available: 2,
        missing: 1,
      });
    });
  });

  describe("3. Retrieval and Reservation (FOR UPDATE SKIP LOCKED)", () => {
    it("should retrieve and reserve questions successfully inside a transaction", async () => {
      // Mock availability check to pass
      prismaMock.question.count.mockResolvedValue(10);

      // Mock raw SQL output for EASY and MEDIUM queries
      prismaMock.$queryRaw
        .mockResolvedValueOnce([{ id: "q-easy-1" }, { id: "q-easy-2" }])
        .mockResolvedValueOnce([{ id: "q-med-1" }]);

      prismaMock.question.findMany.mockResolvedValue([
        {
          id: "q-easy-1",
          questionText: "E1",
          answer: "A1",
          explanation: "",
          difficulty: "EASY",
          topicId: "t1",
          sectionId: "sec-1",
        },
        {
          id: "q-easy-2",
          questionText: "E2",
          answer: "A2",
          explanation: "",
          difficulty: "EASY",
          topicId: "t1",
          sectionId: "sec-1",
        },
        {
          id: "q-med-1",
          questionText: "M1",
          answer: "A3",
          explanation: "",
          difficulty: "MEDIUM",
          topicId: "t2",
          sectionId: "sec-1",
        },
      ]);

      const request = {
        examId: "exam-1",
        sectionId: "sec-1",
        count: 3,
        difficultyDistribution: {
          EASY: 2,
          MEDIUM: 1,
        },
      };

      const result = await rotationService.retrieveAndReserve(request);

      expect(result.assemblyId).toBeDefined();
      expect(result.questions).toHaveLength(3);
      expect(result.reservationIds).toHaveLength(3);
      expect(prismaMock.questionReservation.createMany).toHaveBeenCalled();
      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it("should fail when concurrent modification empties the available pool before lock", async () => {
      // Mock availability check to pass
      prismaMock.question.count.mockResolvedValue(10);

      // Mock raw SQL output showing insufficient locked questions
      prismaMock.$queryRaw.mockResolvedValue([]); // Returns 0 locked rows

      const request = {
        examId: "exam-1",
        sectionId: "sec-1",
        count: 2,
        difficultyDistribution: {
          EASY: 2,
        },
      };

      await expect(rotationService.retrieveAndReserve(request)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("4. Usage Tracking", () => {
    it("should increment question usage and clear reservations", async () => {
      prismaMock.questionReservation.findMany.mockResolvedValue([
        { id: "res-1", questionId: "q-1", assemblyId: "assembly-1" },
        { id: "res-2", questionId: "q-2", assemblyId: "assembly-1" },
      ]);

      prismaMock.questionUsage.findUnique.mockResolvedValue(null);
      prismaMock.questionReservation.deleteMany.mockResolvedValue({ count: 2 });

      const count = await usageService.trackUsage(
        "assembly-1",
        "exam-1",
        "sec-1",
      );

      expect(count).toBe(2);
      expect(prismaMock.question.update).toHaveBeenCalledTimes(2);
      expect(prismaMock.questionUsage.upsert).toHaveBeenCalledTimes(2);
      expect(prismaMock.questionReservation.deleteMany).toHaveBeenCalledWith({
        where: { assemblyId: "assembly-1" },
      });
    });
  });

  describe("5. Pool Health Metrics", () => {
    it("should return detailed coverage and usage metrics", async () => {
      prismaMock.question.count.mockResolvedValue(100);
      prismaMock.questionReservation.count.mockResolvedValue(10);
      prismaMock.question.groupBy.mockResolvedValue([
        { topicId: "topic-1", _count: { id: 15 } },
        { topicId: "topic-2", _count: { id: 25 } },
      ]);

      const result = await rotationService.getPoolHealth();

      expect(result.totalActiveQuestions).toBe(100);
      expect(result.reservedQuestions).toBe(10);
      expect(
        (result.coverageByDifficulty as Record<string, number>).EASY,
      ).toBeDefined();
      expect(
        (result.coverageByTopic as Record<string, number>)["topic-1"],
      ).toBe(15);
      expect(
        (result.coverageByTopic as Record<string, number>)["topic-2"],
      ).toBe(25);
    });
  });
});
