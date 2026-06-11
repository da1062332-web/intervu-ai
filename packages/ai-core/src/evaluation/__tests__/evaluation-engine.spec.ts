import { EvaluationEngineService } from "../evaluation-engine.service";
import { QuestionSnapshot } from "../score-calculator.service";
import { ExecutionResult } from "@intervu-ai/contracts";

describe("Evaluation Engine Unit & Performance Tests", () => {
  let evaluationEngine: EvaluationEngineService;

  beforeEach(() => {
    evaluationEngine = new EvaluationEngineService();
  });

  const mockQuestions: QuestionSnapshot[] = [
    {
      questionId: "q1",
      correctAnswer: "10",
      questionType: "mcq",
      conceptKey: "time_work",
      difficultyLevel: "easy",
    },
    {
      questionId: "q2",
      correctAnswer: "1/2",
      questionType: "mcq",
      conceptKey: "probability",
      difficultyLevel: "medium",
    },
    {
      questionId: "q3",
      correctAnswer: "25",
      questionType: "numeric",
      conceptKey: "percentages",
      difficultyLevel: "medium",
    },
    {
      questionId: "q4",
      correctAnswer: "5.5",
      questionType: "numeric",
      conceptKey: "averages",
      difficultyLevel: "hard",
    },
  ];

  const createExecutionResult = (
    answers: { questionId: string; answer: string }[]
  ): ExecutionResult => {
    return {
      executionId: "exec_123",
      testId: "test_abc",
      status: "submitted",
      answers,
      submittedAt: new Date(),
    };
  };

  test("EVAL-001: Perfect Score", async () => {
    const perfectAnswers = [
      { questionId: "q1", answer: "10" },
      { questionId: "q2", answer: "1/2" },
      { questionId: "q3", answer: "25.0" }, // numeric matches float
      { questionId: "q4", answer: "5.5" },
    ];
    const result = await evaluationEngine.evaluate(
      createExecutionResult(perfectAnswers),
      mockQuestions
    );

    expect(result.overallScore).toBe(100);
    expect(result.confidenceScore).toBe(100);
    expect(result.skillScores.aptitude).toBe(100);
    expect(result.skillScores.reasoning).toBe(100);
    expect(result.feedback).toContain("Strong in Time and Work.");
    expect(result.feedback).toContain("Strong in Probability.");
    expect(result.feedback).toContain("Strong in Percentages.");
    expect(result.feedback).toContain("Strong in Averages.");
  });

  test("EVAL-002: Partial Score", async () => {
    const partialAnswers = [
      { questionId: "q1", answer: "10" }, // Correct (time_work - aptitude)
      { questionId: "q2", answer: "wrong" }, // Wrong (probability - reasoning)
      { questionId: "q3", answer: "25" }, // Correct (percentages - aptitude)
      { questionId: "q4", answer: "wrong" }, // Wrong (averages - aptitude)
    ];
    const result = await evaluationEngine.evaluate(
      createExecutionResult(partialAnswers),
      mockQuestions
    );

    // overallScore: 2 / 4 = 50%
    expect(result.overallScore).toBe(50);
    expect(result.confidenceScore).toBe(100);

    // aptitude skills: q1 (correct), q3 (correct), q4 (wrong) -> 2/3 = 67%
    expect(result.skillScores.aptitude).toBe(67);
    // reasoning skills: q2 (wrong) -> 0/1 = 0%
    expect(result.skillScores.reasoning).toBe(0);

    expect(result.feedback).toContain("Strong in Time and Work.");
    expect(result.feedback).toContain("Strong in Percentages.");
    expect(result.feedback).toContain("Needs improvement in Averages.");
    expect(result.feedback).toContain("Needs improvement in Probability.");
  });

  test("EVAL-003: Zero Score", async () => {
    const zeroAnswers = [
      { questionId: "q1", answer: "wrong" },
      { questionId: "q2", answer: "wrong" },
      { questionId: "q3", answer: "wrong" },
      { questionId: "q4", answer: "wrong" },
    ];
    const result = await evaluationEngine.evaluate(
      createExecutionResult(zeroAnswers),
      mockQuestions
    );

    expect(result.overallScore).toBe(0);
    expect(result.confidenceScore).toBe(100);
    expect(result.skillScores.aptitude).toBe(0);
    expect(result.skillScores.reasoning).toBe(0);
    expect(result.feedback).toContain("Needs improvement in Time and Work.");
    expect(result.feedback).toContain("Needs improvement in Probability.");
    expect(result.feedback).toContain("Needs improvement in Percentages.");
    expect(result.feedback).toContain("Needs improvement in Averages.");
  });

  test("EVAL-004: Skill Calculation accuracy check", async () => {
    // Aptitude correct (3/3 = 100%), Reasoning wrong (0/1 = 0%)
    const answers = [
      { questionId: "q1", answer: "10" },
      { questionId: "q2", answer: "incorrect" },
      { questionId: "q3", answer: "25" },
      { questionId: "q4", answer: "5.5" },
    ];
    const result = await evaluationEngine.evaluate(
      createExecutionResult(answers),
      mockQuestions
    );

    expect(result.skillScores.aptitude).toBe(100);
    expect(result.skillScores.reasoning).toBe(0);
  });

  test("EVAL-005: Feedback Generation thresholds check", async () => {
    // 1 of 1 probability correct -> 100% -> Strong
    // 0 of 1 time_work correct -> 0% -> Needs improvement
    const answers = [
      { questionId: "q1", answer: "wrong" },
      { questionId: "q2", answer: "1/2" },
      { questionId: "q3", answer: "wrong" },
      { questionId: "q4", answer: "wrong" },
    ];
    const result = await evaluationEngine.evaluate(
      createExecutionResult(answers),
      mockQuestions
    );

    expect(result.feedback).toContain("Strong in Probability.");
    expect(result.feedback).toContain("Needs improvement in Time and Work.");
  });

  test("EVAL-006: Confidence Calculation on blank/unanswered questions", async () => {
    const sparseAnswers = [
      { questionId: "q1", answer: "10" },
      { questionId: "q2", answer: "" }, // blank
      { questionId: "q3", answer: "25" },
      { questionId: "q4", answer: "   " }, // whitespace
    ];
    const result = await evaluationEngine.evaluate(
      createExecutionResult(sparseAnswers),
      mockQuestions
    );

    // Answered = q1 and q3 -> 2 out of 4 -> 50%
    expect(result.confidenceScore).toBe(50);
  });

  test("Validation Failure: Input question count mismatch", async () => {
    const invalidAnswers = [
      { questionId: "q1", answer: "10" },
      { questionId: "q2", answer: "1/2" },
    ]; // missing q3 and q4

    await expect(
      evaluationEngine.evaluate(
        createExecutionResult(invalidAnswers),
        mockQuestions
      )
    ).rejects.toThrow(/Question count mismatch/);
  });

  test("Performance Target: Evaluate 100 assessments under 5 seconds", async () => {
    const executionResults: ExecutionResult[] = [];
    const questionsMap: Record<string, QuestionSnapshot[]> = {};

    for (let i = 0; i < 100; i++) {
      const testId = `test_${i}`;
      const execId = `exec_${i}`;

      const testQuestions: QuestionSnapshot[] = [
        {
          questionId: `q_${i}_1`,
          correctAnswer: "10",
          questionType: "mcq",
          conceptKey: "time_work",
          difficultyLevel: "easy",
        },
        {
          questionId: `q_${i}_2`,
          correctAnswer: "1/2",
          questionType: "mcq",
          conceptKey: "probability",
          difficultyLevel: "medium",
        },
      ];

      const testAnswers = [
        { questionId: `q_${i}_1`, answer: i % 2 === 0 ? "10" : "wrong" },
        { questionId: `q_${i}_2`, answer: "1/2" },
      ];

      executionResults.push({
        executionId: execId,
        testId: testId,
        status: "submitted",
        answers: testAnswers,
        submittedAt: new Date(),
      });

      questionsMap[testId] = testQuestions;
    }

    const start = Date.now();
    const results = await evaluationEngine.evaluateBatch(
      executionResults,
      questionsMap
    );
    const duration = Date.now() - start;

    expect(results.length).toBe(100);
    expect(duration).toBeLessThan(5000); // 5 seconds SLA target
    console.log(`[Performance Report] Evaluated 100 assessments in ${duration}ms`);
  });
});
