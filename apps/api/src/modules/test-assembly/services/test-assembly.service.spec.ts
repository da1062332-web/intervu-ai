import { TestAssemblyService } from "./test-assembly.service";

describe("TestAssemblyService (published snapshot)", () => {
  it("returns published assembled test when found by blueprintId", async () => {
    const mockQueueService: any = { enqueueGeneration: jest.fn() };
    const mockTestRepo: any = { findById: jest.fn() };

    const published = {
      id: "assembled-1",
      configId: "blueprint-123",
      status: "PUBLISHED",
      sections: [
        {
          id: "s1",
          sectionName: "Section 1",
          questions: [
            {
              questionId: "q1",
              questionSnapshot: {
                questionText: "What is 2+2?",
                options: ["3", "4"],
                correctAnswer: "4",
                difficulty: "EASY",
                conceptKey: "math:add",
              },
            },
          ],
        },
      ],
    } as any;

    const mockAssembledRepo: any = {
      findByConfigId: jest.fn().mockResolvedValue(published),
    };
    const mockPrisma: any = {
      generationJob: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
      blueprint: { findFirst: jest.fn() },
      question: { findMany: jest.fn() },
    };

    const svc = new TestAssemblyService(
      mockQueueService,
      mockTestRepo,
      mockAssembledRepo,
      mockPrisma,
    );

    const req: any = {
      blueprintId: "blueprint-123",
      topicId: null,
      difficulty: "EASY",
      quantity: 1,
    };

    const res = (await svc.generateQuestions(req)) as any;

    expect(mockAssembledRepo.findByConfigId).toHaveBeenCalledWith(
      "blueprint-123",
    );
    expect(res).toBeDefined();
    expect(res.testId).toEqual("assembled-1");
    expect(res.status).toEqual("PUBLISHED");
    expect(Array.isArray(res.questions)).toBe(true);
    expect(res.questions.length).toBe(1);
    expect(res.questions[0].questionText).toContain("2+2");
  });
});
