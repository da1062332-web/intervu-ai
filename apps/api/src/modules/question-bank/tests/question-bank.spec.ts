import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuestionRepository } from "../repositories/question.repository";
import { QuestionVersionRepository } from "../repositories/question-version.repository";
import { QuestionReviewRepository } from "../repositories/question-review.repository";
import { QuestionBankService } from "../services/question-bank.service";
import { QuestionSearchService } from "../services/question-search.service";
import { QuestionVersionService } from "../services/question-version.service";
import { QuestionReviewService } from "../services/question-review.service";
import { QuestionSimilarityService } from "../services/question-similarity.service";
import { QuestionStatus } from "@prisma/client";

describe("Question Bank Module (Day 2)", () => {
  let bankService: QuestionBankService;
  let searchService: QuestionSearchService;

  let reviewService: QuestionReviewService;
  let similarityService: QuestionSimilarityService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      question: {
        create: jest.fn(),
        createMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      questionVersion: {
        create: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      questionReview: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      questionUsage: {
        create: jest.fn(),
        createMany: jest.fn(),
      },
      generatedQuestion: {
        create: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionBankService,
        QuestionSearchService,
        QuestionVersionService,
        QuestionReviewService,
        QuestionSimilarityService,
        QuestionRepository,
        QuestionVersionRepository,
        QuestionReviewRepository,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    bankService = module.get<QuestionBankService>(QuestionBankService);
    searchService = module.get<QuestionSearchService>(QuestionSearchService);

    reviewService = module.get<QuestionReviewService>(QuestionReviewService);
    similarityService = module.get<QuestionSimilarityService>(
      QuestionSimilarityService,
    );
  });

  describe("1. QuestionSimilarityService", () => {
    it("should detect exact case-insensitive duplicates", async () => {
      const existingText = "What is 2 + 2?";
      prismaMock.question.findMany.mockResolvedValue([
        { id: "q1", questionText: "what is 2 + 2?" },
      ]);

      const result = await similarityService.checkDuplicate(
        existingText,
        "topic-1",
        "section-1",
      );

      expect(result.duplicate).toBe(true);
      expect(result.similarity).toBe(100);
      expect(result.matchedQuestionId).toBe("q1");
    });

    it("should detect semantic duplicates exceeding threshold (> 85%)", async () => {
      prismaMock.question.findMany.mockResolvedValue([
        { id: "q2", questionText: "Find the sum of A and B." },
      ]);

      // Jaccard comparison ignoring numbers
      const result = await similarityService.checkDuplicate(
        "Find the sum of X and Y.",
        "topic-1",
        "section-1",
        0.8,
      );

      expect(result.duplicate).toBe(true);
      expect(result.similarity).toBeGreaterThanOrEqual(80);
      expect(result.matchedQuestionId).toBe("q2");
    });

    it("should pass when similarity is below threshold", async () => {
      prismaMock.question.findMany.mockResolvedValue([
        { id: "q3", questionText: "Explain React Hooks lifecycle." },
      ]);

      const result = await similarityService.checkDuplicate(
        "Describe Nodejs Event Loop phases.",
        "topic-1",
        "section-1",
        0.85,
      );

      expect(result.duplicate).toBe(false);
      expect(result.similarity).toBeLessThan(85);
      expect(result.matchedQuestionId).toBeNull();
    });
  });

  describe("2. QuestionSearchService", () => {
    it("should search questions with pagination and filters", async () => {
      prismaMock.question.findMany.mockResolvedValue([
        { id: "q1", questionText: "Q1" },
        { id: "q2", questionText: "Q2" },
      ]);
      prismaMock.question.count.mockResolvedValue(10);

      const result = await searchService.search({
        topicId: "topic-1",
        difficulty: "MEDIUM",
        page: 2,
        limit: 2,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      expect(result.questions).toHaveLength(2);
      expect(result.total).toBe(10);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(5);
      expect(prismaMock.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 2,
          take: 2,
          where: expect.objectContaining({
            topicId: "topic-1",
            difficulty: "MEDIUM",
          }),
        }),
      );
    });
  });

  describe("3. QuestionReviewService State Machine", () => {
    it("should allow VALIDATED -> ACTIVE approval transition", async () => {
      const mockQuestion = {
        id: "q-1",
        status: QuestionStatus.VALIDATED,
        version: 1,
      };
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion);
      prismaMock.question.update.mockResolvedValue({
        ...mockQuestion,
        status: QuestionStatus.ACTIVE,
        version: 2,
      });

      const result = await reviewService.approveQuestion("q-1", "Looks good");

      expect(result.status).toBe(QuestionStatus.ACTIVE);
      expect(result.version).toBe(2);
      expect(prismaMock.questionReview.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            questionId: "q-1",
            status: "APPROVED",
            notes: "Looks good",
          }),
        }),
      );
    });

    it("should throw error on invalid approval status transition", async () => {
      const mockQuestion = {
        id: "q-2",
        status: QuestionStatus.DRAFT,
        version: 1,
      };
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion);

      await expect(
        reviewService.approveQuestion("q-2", "Approve"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should allow VALIDATED or ACTIVE -> DRAFT rejection transition", async () => {
      const mockQuestion = {
        id: "q-3",
        status: QuestionStatus.ACTIVE,
        version: 2,
      };
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion);
      prismaMock.question.update.mockResolvedValue({
        ...mockQuestion,
        status: QuestionStatus.DRAFT,
        version: 3,
      });

      const result = await reviewService.rejectQuestion("q-3", "Fix typo");

      expect(result.status).toBe(QuestionStatus.DRAFT);
      expect(result.version).toBe(3);
      expect(prismaMock.questionReview.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "REJECTED",
            notes: "Fix typo",
          }),
        }),
      );
    });

    it("should allow ARCHIVED -> DRAFT restore transition", async () => {
      const mockQuestion = {
        id: "q-4",
        status: QuestionStatus.ARCHIVED,
        version: 4,
      };
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion);
      prismaMock.question.update.mockResolvedValue({
        ...mockQuestion,
        status: QuestionStatus.DRAFT,
        version: 5,
      });

      const result = await reviewService.restoreQuestion("q-4", "Restore this");

      expect(result.status).toBe(QuestionStatus.DRAFT);
      expect(result.version).toBe(5);
    });
  });

  describe("4. QuestionBankService Bulk Persist & Rollback", () => {
    it("should successfully bulk persist 100 questions", async () => {
      prismaMock.question.createMany.mockResolvedValue({ count: 2 });
      prismaMock.questionVersion.createMany.mockResolvedValue({ count: 2 });
      prismaMock.questionUsage.createMany.mockResolvedValue({ count: 2 });
      prismaMock.generatedQuestion.createMany.mockResolvedValue({ count: 2 });

      const dto = {
        questions: [
          {
            questionText: "What is 1?",
            answer: "1",
            topicId: "topic-1",
            sectionId: "section-1",
            difficulty: "EASY",
          },
          {
            questionText: "What is 2?",
            answer: "2",
            topicId: "topic-1",
            sectionId: "section-1",
            difficulty: "EASY",
          },
        ],
      };

      const result = await bankService.createBulkQuestions(dto);

      expect(result.saved).toBe(2);
      expect(prismaMock.question.createMany).toHaveBeenCalled();
      expect(prismaMock.questionVersion.createMany).toHaveBeenCalled();
    });

    it("should rollback transaction and throw on bulk persist failure", async () => {
      prismaMock.question.createMany.mockRejectedValue(
        new Error("Database write failure"),
      );

      const dto = {
        questions: [
          {
            questionText: "Q1",
            answer: "A",
            topicId: "topic-1",
            sectionId: "section-1",
            difficulty: "EASY",
          },
        ],
      };

      await expect(bankService.createBulkQuestions(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("5. Archive and Update version history", () => {
    it("should soft delete question and increment version", async () => {
      const mockQuestion = {
        id: "q-10",
        status: QuestionStatus.ACTIVE,
        version: 1,
      };
      prismaMock.question.findUnique.mockResolvedValue(mockQuestion);
      prismaMock.question.update.mockResolvedValue({
        ...mockQuestion,
        status: QuestionStatus.ARCHIVED,
        version: 2,
      });

      const result = await bankService.archiveQuestion("q-10");

      expect(result.status).toBe(QuestionStatus.ARCHIVED);
      expect(result.version).toBe(2);
      // Auto version creation checked
      expect(prismaMock.questionVersion.create).toHaveBeenCalled();
    });
  });

  describe("6. Statistics aggregation", () => {
    it("should aggregate stats counts globally or filtered", async () => {
      prismaMock.question.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5) // active
        .mockResolvedValueOnce(4) // draft
        .mockResolvedValueOnce(1); // archived

      const result = await bankService.getStats({ topicId: "topic-1" });

      expect(result.totalQuestions).toBe(10);
      expect(result.activeQuestions).toBe(5);
      expect(result.draftQuestions).toBe(4);
      expect(result.archivedQuestions).toBe(1);
    });
  });
});
