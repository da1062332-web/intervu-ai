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
});
