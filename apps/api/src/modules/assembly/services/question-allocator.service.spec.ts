import {
  QuestionAllocatorService,
  AllocationConfig,
} from "./question-allocator.service";
import { AntiRepetitionService } from "./anti-repetition.service";
import { BlueprintSectionDto } from "@intervu/shared";
import { IQuestionSource } from "./question-source.interface";

describe("QuestionAllocatorService", () => {
  let service: QuestionAllocatorService;
  let sourceMock: jest.Mocked<IQuestionSource>;
  let antiRepRepo: jest.Mocked<AntiRepetitionService>;

  beforeEach(() => {
    sourceMock = {
      fetchQuestions: jest.fn(),
    } as never;

    antiRepRepo = {
      filterPool: jest.fn((pool: unknown) => pool), // pass-through
    } as never;

    service = new QuestionAllocatorService(sourceMock, antiRepRepo);
  });

  it("should allocate questions correctly", async () => {
    const section: BlueprintSectionDto = {
      sectionKey: "sec-1",
      displayName: "Section 1",
      durationSeconds: 120,
      questionCount: 2,
      orderIndex: 0,
      topicAllocations: [{ topicId: "top-1", percentage: 100 }],
      difficultyDistribution: { EASY: 100, MEDIUM: 0, HARD: 0 },
    };

    sourceMock.fetchQuestions.mockResolvedValue([
      {
        id: "q1",
        conceptKey: "top-1",
        difficultyLevel: "EASY",
        questionType: "MCQ",
      },
      {
        id: "q2",
        conceptKey: "top-1",
        difficultyLevel: "EASY",
        questionType: "MCQ",
      },
    ] as never);

    const fallbackConfig: AllocationConfig = {
      distribution: { EASY: 33, MEDIUM: 33, HARD: 34 },
    };

    const allocated = await service.allocateQuestions(
      section,
      new Set(),
      [],
      fallbackConfig,
    );
    expect(allocated).toHaveLength(2);
    expect(allocated[0].questionId).toBe("q1");
    expect(allocated[1].questionId).toBe("q2");
  });

  it("should replenish questions if anti-repetition filters some out", async () => {
    const section: BlueprintSectionDto = {
      sectionKey: "sec-1",
      displayName: "Section 1",
      durationSeconds: 120,
      questionCount: 2,
      orderIndex: 0,
      topicAllocations: [{ topicId: "top-1", percentage: 100 }],
      difficultyDistribution: { EASY: 100, MEDIUM: 0, HARD: 0 },
    };

    // First fetch returns q1, q2
    // Second fetch (replenishment) returns q3, q4
    sourceMock.fetchQuestions
      .mockResolvedValueOnce([
        {
          id: "q1",
          conceptKey: "top-1",
          difficultyLevel: "EASY",
          questionType: "MCQ",
        },
        {
          id: "q2",
          conceptKey: "top-1",
          difficultyLevel: "EASY",
          questionType: "MCQ",
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "q3",
          conceptKey: "top-1",
          difficultyLevel: "EASY",
          questionType: "MCQ",
        },
        {
          id: "q4",
          conceptKey: "top-1",
          difficultyLevel: "EASY",
          questionType: "MCQ",
        },
      ] as never);

    // Filter mocks: first time q2 is rejected (e.g. duplicate)
    antiRepRepo.filterPool
      .mockResolvedValueOnce([
        {
          id: "q1",
          conceptKey: "top-1",
          difficultyLevel: "EASY",
          questionType: "MCQ",
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "q3",
          conceptKey: "top-1",
          difficultyLevel: "EASY",
          questionType: "MCQ",
        },
      ] as never);

    const fallbackConfig: AllocationConfig = {
      distribution: { EASY: 100, MEDIUM: 0, HARD: 0 },
    };

    const allocated = await service.allocateQuestions(
      section,
      new Set(),
      [],
      fallbackConfig,
    );

    expect(sourceMock.fetchQuestions).toHaveBeenCalledTimes(2);
    expect(allocated).toHaveLength(2);
    expect(allocated[0].questionId).toBe("q1");
    expect(allocated[1].questionId).toBe("q3");
  });

  it("should plan section-level topic quotas before per-difficulty bucket allocation", async () => {
    const section: BlueprintSectionDto = {
      sectionKey: "sec-1",
      displayName: "Section 1",
      durationSeconds: 120,
      questionCount: 7,
      orderIndex: 0,
      topicAllocations: [
        { topicId: "ages", percentage: 50 },
        { topicId: "math", percentage: 50 },
      ],
      difficultyDistribution: { EASY: 40, MEDIUM: 40, HARD: 20 },
    };

    sourceMock.fetchQuestions.mockImplementation(
      async ({ conceptKey, difficultyLevel, limit }) => {
        const safeLimit = Math.max(0, Math.min(limit ?? 10, 10));
        return Array.from({ length: safeLimit }, (_, index) => ({
          id: `${conceptKey}-${difficultyLevel}-${index + 1}`,
          conceptKey,
          difficultyLevel,
          questionType: "MCQ",
        })) as never;
      },
    );

    const fallbackConfig: AllocationConfig = {
      distribution: { EASY: 40, MEDIUM: 40, HARD: 20 },
    };

    const allocated = await service.allocateQuestions(
      section,
      new Set(),
      [],
      fallbackConfig,
    );

    const topicCounts = allocated.reduce(
      (acc, q) => {
        acc[q.conceptKey] = (acc[q.conceptKey] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    expect(allocated).toHaveLength(7);
    expect(topicCounts["ages"]).toBe(4);
    expect(topicCounts["math"]).toBe(3);
  });

  it("should preserve section difficulty totals while using section-level topic quotas", async () => {
    const section: BlueprintSectionDto = {
      sectionKey: "sec-1",
      displayName: "Section 1",
      durationSeconds: 120,
      questionCount: 7,
      orderIndex: 0,
      topicAllocations: [
        { topicId: "ages", percentage: 50 },
        { topicId: "math", percentage: 50 },
      ],
      difficultyDistribution: { EASY: 40, MEDIUM: 40, HARD: 20 },
    };

    sourceMock.fetchQuestions.mockImplementation(
      async ({ conceptKey, difficultyLevel, limit }) => {
        const safeLimit = Math.max(0, Math.min(limit ?? 10, 10));
        return Array.from({ length: safeLimit }, (_, index) => ({
          id: `${conceptKey}-${difficultyLevel}-${index + 1}`,
          conceptKey,
          difficultyLevel,
          questionType: "MCQ",
        })) as never;
      },
    );

    const fallbackConfig: AllocationConfig = {
      distribution: { EASY: 40, MEDIUM: 40, HARD: 20 },
    };

    const allocated = await service.allocateQuestions(
      section,
      new Set(),
      [],
      fallbackConfig,
    );

    const difficultyCounts = allocated.reduce(
      (acc, q) => {
        acc[q.difficultyLevel] = (acc[q.difficultyLevel] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    expect(difficultyCounts.EASY).toBe(3);
    expect(difficultyCounts.MEDIUM).toBe(3);
    expect(difficultyCounts.HARD).toBe(1);
  });

  it("should throw BadRequestException if pool is exhausted after bounded attempts", async () => {
    const section: BlueprintSectionDto = {
      sectionKey: "sec-1",
      displayName: "Section 1",
      durationSeconds: 120,
      questionCount: 2,
      orderIndex: 0,
      topicAllocations: [{ topicId: "top-1", percentage: 100 }],
      difficultyDistribution: { EASY: 100, MEDIUM: 0, HARD: 0 },
    };

    sourceMock.fetchQuestions.mockResolvedValue([]);
    antiRepRepo.filterPool.mockResolvedValue([]);

    const fallbackConfig: AllocationConfig = {
      distribution: { EASY: 100, MEDIUM: 0, HARD: 0 },
    };

    let error: any;
    try {
      await service.allocateQuestions(section, new Set(), [], fallbackConfig);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.response.error).toBe("INSUFFICIENT_ELIGIBLE_QUESTIONS");
  });
});
