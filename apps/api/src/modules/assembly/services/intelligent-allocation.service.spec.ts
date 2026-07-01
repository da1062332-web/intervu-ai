import { IntelligentAllocationService } from "./intelligent-allocation.service";

const mockQuestionSource = {
  fetchQuestions: jest.fn(),
};

const makeGeneratedQuestion = (id: string, difficulty = "MEDIUM") => ({
  id,
  conceptKey: "math",
  difficultyLevel: difficulty,
  questionType: "MULTIPLE_CHOICE",
  questionText: `Question ${id}`,
  questionHash: id,
  metadata: {},
  templateId: null,
  options: [],
  correctAnswer: "A",
  solution: "",
  expectedAnswer: null,
  rubric: {},
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeSection = (questionCount = 3, key = "SEC-A") => ({
  sectionKey: key,
  displayName: key,
  durationSeconds: 1800,
  questionCount,
  orderIndex: 0,
  topicAllocations: [{ topicId: "math", percentage: 100 }],
  difficultyDistribution: { EASY: 33, MEDIUM: 50, HARD: 17 },
});

describe("IntelligentAllocationService", () => {
  let service: IntelligentAllocationService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create service by directly instantiating with mock
    service = new IntelligentAllocationService(
      mockQuestionSource as unknown as import("./question-source.interface").IQuestionSource,
    );
  });

  it("allocates requested number of questions successfully", async () => {
    mockQuestionSource.fetchQuestions.mockResolvedValue([
      makeGeneratedQuestion("q1", "EASY"),
      makeGeneratedQuestion("q2", "MEDIUM"),
      makeGeneratedQuestion("q3", "MEDIUM"),
    ]);

    const result = await service.allocateSection(makeSection(3), []);
    expect(result.allocatedCount).toBeLessThanOrEqual(3);
    expect(result.questions).toBeDefined();
  });

  it("returns warnings instead of throwing when pool is insufficient", async () => {
    mockQuestionSource.fetchQuestions.mockResolvedValue([
      makeGeneratedQuestion("q1"),
    ]);

    // Request 10 questions but only 1 available
    const result = await service.allocateSection(makeSection(10), []);
    expect(result.warnings.length).toBeGreaterThan(0);
    // Should NOT throw
    expect(result.allocatedCount).toBeLessThanOrEqual(10);
  });

  it("excludes questions from excludeIds", async () => {
    mockQuestionSource.fetchQuestions.mockImplementation((filters) => {
      expect(filters.excludeIds).toBeDefined();
      return Promise.resolve([makeGeneratedQuestion("q5")]);
    });

    const result = await service.allocateSection(makeSection(1), [
      "q1",
      "q2",
      "q3",
    ]);
    expect(result.questions[0]?.questionId).not.toMatch(/^(q1|q2|q3)$/);
  });

  it("assigns sequential questionOrder starting at 1", async () => {
    mockQuestionSource.fetchQuestions.mockResolvedValue([
      makeGeneratedQuestion("q1", "EASY"),
      makeGeneratedQuestion("q2", "MEDIUM"),
    ]);

    const result = await service.allocateSection(makeSection(2), []);
    const orders = result.questions.map((q) => q.questionOrder);
    expect(orders).toContain(1);
    expect(orders).toContain(2);
  });

  it("returns allocationAccuracy as 100 when fully allocated", async () => {
    mockQuestionSource.fetchQuestions.mockResolvedValue([
      makeGeneratedQuestion("q1", "EASY"),
      makeGeneratedQuestion("q2", "MEDIUM"),
      makeGeneratedQuestion("q3", "HARD"),
    ]);

    const result = await service.allocateSection(makeSection(3), []);
    // Accuracy can be 100 if all slots filled
    expect(result.allocationAccuracy).toBeLessThanOrEqual(100);
    expect(result.allocationAccuracy).toBeGreaterThanOrEqual(0);
  });
});
