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
      { id: "q2", answer: '["A", "B"]', questionType: "MSQ" }, // mismatch
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
  it("should correctly handle JSON-wrapped answers and option index normalization", () => {
    const options = [
      { text: "Paris", value: "opt-0" },
      { text: "London", value: "opt-1" },
      { text: "Berlin", value: "opt-2" },
      { text: "Madrid", value: "opt-3" },
    ];

    // Case 1: Candidate answer is JSON string '{"selectedOptionId":"opt-1"}' and expected is "opt-1"
    expect(
      service.compareAnswers('{"selectedOptionId":"opt-1"}', "opt-1", "MCQ", options),
    ).toBe(true);

    // Case 2: Candidate answer is JSON string '{"selectedOptionId":"opt-1"}' and expected is "London"
    expect(
      service.compareAnswers('{"selectedOptionId":"opt-1"}', "London", "MCQ", options),
    ).toBe(true);

    // Case 3: Candidate answer is "opt-0" and expected is "Paris"
    expect(service.compareAnswers("opt-0", "Paris", "MCQ", options)).toBe(true);

    // Case 4: Candidate answer is "Option B" and expected is "opt-1"
    expect(service.compareAnswers("Option B", "opt-1", "MCQ", options)).toBe(true);

    // Case 5: Candidate answer is index "2" and expected is "opt-2"
    expect(service.compareAnswers("2", "opt-2", "MCQ", options)).toBe(true);

    // Case 6: Candidate answer is wrong
    expect(service.compareAnswers("opt-0", "London", "MCQ", options)).toBe(false);
  });

  it("should NOT match non-numeric strings with same leading numbers (prevent unit/noun false-positives)", () => {
    const options = [
      { text: "20 km", value: "opt-0" },
      { text: "20 miles", value: "opt-1" },
      { text: "30 km", value: "opt-2" },
      { text: "40 km", value: "opt-3" },
    ];

    // "20 km" vs "20 miles" must NOT be treated as equal
    expect(service.compareAnswers("20 km", "20 miles", "MCQ", options)).toBe(false);
    expect(service.compareAnswers("2 hours", "2 days", "MCQ")).toBe(false);
    expect(service.compareAnswers("5 red balls", "5 blue balls", "MCQ")).toBe(false);

    // Pure numeric strings should match
    expect(service.compareAnswers("42", "42.00", "MCQ")).toBe(true);
    expect(service.compareAnswers("-15.5", "-15.500", "MCQ")).toBe(true);
  });

  it("should handle literal letter option texts without index collisions", () => {
    const options = [
      { text: "A", value: "opt-0" },
      { text: "B", value: "opt-1" },
      { text: "C", value: "opt-2" },
      { text: "D", value: "opt-3" },
    ];

    // Selecting literal "A" when expected is "A" should be true
    expect(service.compareAnswers("A", "A", "MCQ", options)).toBe(true);

    // Selecting literal "A" when expected is "B" should be false
    expect(service.compareAnswers("A", "B", "MCQ", options)).toBe(false);
  });
});
