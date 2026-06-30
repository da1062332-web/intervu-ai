import { ObjectiveEvaluatorService } from "../objective/objective-evaluator.service";
import { AnswerDto } from "@intervu-ai/contracts";

describe("ObjectiveEvaluatorService Unit Tests", () => {
  let service: ObjectiveEvaluatorService;

  beforeEach(() => {
    service = new ObjectiveEvaluatorService();
  });

  it("should evaluate MCQ single-choice answer correctly", () => {
    const answers: AnswerDto[] = [
      {
        questionId: "q1",
        selectedOptionId: "A",
        status: "ANSWERED",
        timeSpentSeconds: 15,
      },
      {
        questionId: "q2",
        selectedOptionId: "B",
        status: "ANSWERED",
        timeSpentSeconds: 20,
      },
    ];

    const questions = [
      { id: "q1", answer: "A", questionType: "MCQ" },
      { id: "q2", answer: "C", questionType: "MCQ" },
    ];

    const results = service.evaluateAnswers(answers, questions);

    expect(results.length).toBe(2);
    expect(results[0].isCorrect).toBe(true);
    expect(results[0].score).toBe(1);
    expect(results[1].isCorrect).toBe(false);
    expect(results[1].score).toBe(0);
  });

  it("should evaluate MSQ multiple-select answer correctly", () => {
    const answers: AnswerDto[] = [
      {
        questionId: "q1",
        selectedOptionIds: ["A", "B"],
        status: "ANSWERED",
        timeSpentSeconds: 30,
      },
      {
        questionId: "q2",
        selectedOptionIds: ["A", "C"],
        status: "ANSWERED",
        timeSpentSeconds: 40,
      },
    ];

    const questions = [
      { id: "q1", answer: "B,A", questionType: "MSQ" },
      { id: "q2", answer: "[\"A\", \"B\"]", questionType: "MSQ" }, // mismatch
    ];

    const results = service.evaluateAnswers(answers, questions);

    expect(results.length).toBe(2);
    expect(results[0].isCorrect).toBe(true);
    expect(results[0].score).toBe(1);
    expect(results[1].isCorrect).toBe(false);
    expect(results[1].score).toBe(0);
  });

  it("should evaluate Numeric answer with float precision correctly", () => {
    const answers: AnswerDto[] = [
      {
        questionId: "q1",
        textResponse: "25.00005",
        status: "ANSWERED",
        timeSpentSeconds: 10,
      },
      {
        questionId: "q2",
        textResponse: "25.01",
        status: "ANSWERED",
        timeSpentSeconds: 12,
      },
    ];

    const questions = [
      { id: "q1", answer: "25.0", questionType: "Numeric" }, // difference 0.00005 < 0.0001 -> correct
      { id: "q2", answer: "25.0", questionType: "Numeric" }, // difference 0.01 > 0.0001 -> incorrect
    ];

    const results = service.evaluateAnswers(answers, questions);

    expect(results.length).toBe(2);
    expect(results[0].isCorrect).toBe(true);
    expect(results[0].score).toBe(1);
    expect(results[1].isCorrect).toBe(false);
    expect(results[1].score).toBe(0);
  });
});
