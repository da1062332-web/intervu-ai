import { QuestionPoolRepository } from "./question-pool.repository";

describe("QuestionPoolRepository", () => {
  let repository: QuestionPoolRepository;
  let prismaMock: {
    question: { findMany: jest.Mock };
    generatedQuestion: { findMany: jest.Mock };
  };

  beforeEach(() => {
    prismaMock = {
      question: { findMany: jest.fn() },
      generatedQuestion: { findMany: jest.fn() },
    };

    repository = new QuestionPoolRepository(prismaMock as any);
  });

  it("uses persisted questions from the question bank instead of fabricating mock questions", async () => {
    prismaMock.question.findMany.mockResolvedValue([
      {
        id: "real-q-1",
        questionText: "Real AI generated question",
        answer: "A",
        explanation: "Because the model generated it",
        topicId: "topic-1",
        sectionId: "section-1",
        difficulty: "EASY",
        questionType: "MCQ",
        templateId: "template-1",
        metadata: { options: ["A", "B", "C", "D"] },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    prismaMock.generatedQuestion.findMany.mockResolvedValue([]);

    const questions = await repository.findAvailableQuestions(
      "topic-1",
      "EASY" as any,
      5,
      [],
    );

    expect(prismaMock.question.findMany).toHaveBeenCalled();
    expect(questions).toHaveLength(1);
    expect(questions[0]).toMatchObject({
      id: "real-q-1",
      conceptKey: "topic-1",
      questionText: "Real AI generated question",
    });
    expect(questions[0].id).not.toMatch(/^mock-q-/);
  });
});
