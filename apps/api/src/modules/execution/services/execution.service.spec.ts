import { ExecutionService } from "./execution.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { TestInstanceRepository } from "../repositories";
import { ExecutionValidatorService } from "./execution-validator.service";

describe("ExecutionService - Security & Answer Sanitization", () => {
  let executionService: ExecutionService;
  let mockPrisma: any;
  let mockTestInstanceRepo: any;
  let mockValidator: any;

  beforeEach(() => {
    mockPrisma = {
      executionState: {
        findUnique: vi.fn().mockResolvedValue({
          currentSectionIndex: 0,
          currentQuestionIndex: 0,
        }),
      },
      question: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      template: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      examConfig: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    mockTestInstanceRepo = {
      loadDeepSnapshot: vi.fn(),
    };

    mockValidator = {
      validateAssessment: vi.fn().mockResolvedValue({ id: "inst-1", userId: "user-1" }),
      validateOwnership: vi.fn(),
    };

    executionService = new ExecutionService(
      mockPrisma as PrismaService,
      mockTestInstanceRepo as TestInstanceRepository,
      mockValidator as ExecutionValidatorService,
    );
  });

  it("should completely strip all answer, solution, explanation, and option correctness properties from candidate snapshots", async () => {
    mockTestInstanceRepo.loadDeepSnapshot.mockResolvedValue({
      id: "inst-1",
      testConfigId: "cfg-1",
      status: "IN_PROGRESS",
      sections: [
        {
          id: "sec-1",
          sectionKey: "sec_mcq",
          sectionName: "MCQ Section",
          durationSeconds: 1800,
          status: "ACTIVE",
          questions: [
            {
              questionId: "q-1",
              questionOrder: 0,
              questionSnapshot: {
                questionText: "What is 2 + 2?",
                questionType: "MCQ",
                correctAnswer: "4",
                answer: "4",
                correct_answer: "4",
                correctOption: "4",
                correct_option: "4",
                correctAnswerId: "opt-2",
                answerKey: "B",
                solution: "2 + 2 equals 4",
                solutionText: "Detailed explanation",
                explanation: "Because 2 plus 2 is 4",
                hints: ["Think about basic math"],
                hint: "Basic math",
                options: [
                  { id: "opt-1", text: "3", isCorrect: false },
                  { id: "opt-2", text: "4", isCorrect: true },
                  { id: "opt-3", text: "5", is_correct: false },
                ],
                mcqData: {
                  correctAnswer: "4",
                  explanation: "Because 2 + 2 = 4",
                  options: [
                    { id: "opt-1", text: "3", isCorrect: false },
                    { id: "opt-2", text: "4", isCorrect: true },
                  ],
                },
                metadata: {
                  correctAnswer: "4",
                  solution: "2 + 2 = 4",
                  topic: "Math",
                },
                codingData: {
                  patternId: "p1",
                  starterCode: { java: "class Solution {}" },
                  publicTests: [{ input: "2 2", expectedOutput: "4" }],
                  hiddenTests: [{ input: "10 20", expectedOutput: "30" }],
                  stressTests: [{ input: "1000 2000" }],
                  boundaryTests: [{ input: "0 0" }],
                  expectedOutput: "4",
                  solution: "return a + b;",
                  oracleSolution: "return a + b;",
                },
              },
            },
          ],
        },
      ],
    });

    const result = await executionService.loadAssessment("inst-1", "user-1");

    expect(result).toBeDefined();
    expect(result.sections.length).toBe(1);

    const question = result.sections[0].questions[0];
    const snap = question.snapshot as any;

    // Verify all answer, solution, and explanation fields are deleted
    expect(snap.correctAnswer).toBeUndefined();
    expect(snap.answer).toBeUndefined();
    expect(snap.correct_answer).toBeUndefined();
    expect(snap.correctOption).toBeUndefined();
    expect(snap.correct_option).toBeUndefined();
    expect(snap.correctAnswerId).toBeUndefined();
    expect(snap.answerKey).toBeUndefined();
    expect(snap.solution).toBeUndefined();
    expect(snap.solutionText).toBeUndefined();
    expect(snap.solution_text).toBeUndefined();
    expect(snap.explanation).toBeUndefined();
    expect(snap.hints).toBeUndefined();
    expect(snap.hint).toBeUndefined();

    // Verify option correctness flags are stripped
    expect(snap.options).toBeDefined();
    snap.options.forEach((opt: any) => {
      if (typeof opt === "object") {
        expect(opt.isCorrect).toBeUndefined();
        expect(opt.is_correct).toBeUndefined();
        expect(opt.correct).toBeUndefined();
        expect(opt.isAnswer).toBeUndefined();
      }
    });

    // Verify metadata is sanitized
    expect(snap.metadata.topic).toBe("Math");
    expect(snap.metadata.correctAnswer).toBeUndefined();
    expect(snap.metadata.solution).toBeUndefined();

    // Verify mcqData is sanitized
    expect(snap.mcqData.correctAnswer).toBeUndefined();
    expect(snap.mcqData.explanation).toBeUndefined();
    snap.mcqData.options.forEach((opt: any) => {
      expect(opt.isCorrect).toBeUndefined();
    });

    // Verify codingData hidden tests and solutions are stripped
    expect(snap.codingData.starterCode).toBeDefined();
    expect(snap.codingData.publicTests).toBeDefined();
    expect(snap.codingData.hiddenTests).toBeUndefined();
    expect(snap.codingData.stressTests).toBeUndefined();
    expect(snap.codingData.boundaryTests).toBeUndefined();
    expect(snap.codingData.expectedOutput).toBeUndefined();
    expect(snap.codingData.solution).toBeUndefined();
    expect(snap.codingData.oracleSolution).toBeUndefined();
  });
});
