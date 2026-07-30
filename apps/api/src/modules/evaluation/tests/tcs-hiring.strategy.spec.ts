import { TcsHiringStrategy } from "../strategies/tcs-hiring.strategy";
import { HiringEvaluationContext } from "../strategies/hiring-evaluation-strategy.interface";

describe("TcsHiringStrategy", () => {
  let strategy: TcsHiringStrategy;

  beforeEach(() => {
    strategy = new TcsHiringStrategy();
  });

  const baseConfig = {
    examConfigId: "cfg_tcs_1",
    strategy: "TCS",
    enabled: true,
    ninjaThreshold: 15,
    digitalThreshold: 25,
    primeThreshold: 35,
    advancedDigitalMin: 8,
    advancedPrimeMin: 12,
    codingTotalProblems: 2,
    codingDigitalMinSolved: 1,
    codingPrimeMinSolved: 2,
    sectionMappings: [
      { sectionCode: "SEC_NUM", sectionName: "Numerical Ability", mappingType: "NUMERICAL" as const, minimumCorrectAnswers: 5 },
      { sectionCode: "SEC_VERB", sectionName: "Verbal Ability", mappingType: "VERBAL" as const, minimumCorrectAnswers: 5 },
      { sectionCode: "SEC_REAS", sectionName: "Reasoning Ability", mappingType: "REASONING" as const, minimumCorrectAnswers: 5 },
      { sectionCode: "SEC_ADV", sectionName: "Advanced Aptitude", mappingType: "ADVANCED_APTITUDE" as const, minimumCorrectAnswers: 0 },
      { sectionCode: "SEC_CODE", sectionName: "Coding Section", mappingType: "CODING" as const, minimumCorrectAnswers: 0 },
    ],
  };

  it("should return NOT_QUALIFIED if any sectional cutoff fails", async () => {
    const context: HiringEvaluationContext = {
      config: baseConfig,
      sectionScores: [
        { sectionKey: "SEC_NUM", sectionName: "Numerical Ability", correct: 3, incorrect: 7 }, // Failed (req 5)
        { sectionKey: "SEC_VERB", sectionName: "Verbal Ability", correct: 8, incorrect: 2 },
        { sectionKey: "SEC_REAS", sectionName: "Reasoning Ability", correct: 8, incorrect: 2 },
      ],
      objectiveEvalResults: [],
      codingEvalResults: [],
    };

    const result = await strategy.evaluate(context);
    expect(result.qualification).toBe("NOT_QUALIFIED");
    expect(result.qualificationReason).toBe("Sectional cutoff not cleared");
    expect(result.foundationBreakdown.sectionsBreakdown[0].passed).toBe(false);
  });

  it("should return NOT_QUALIFIED if Foundation Total is below Ninja threshold", async () => {
    const context: HiringEvaluationContext = {
      config: baseConfig,
      sectionScores: [
        { sectionKey: "SEC_NUM", sectionName: "Numerical Ability", correct: 5, incorrect: 5 }, // Passed (5)
        { sectionKey: "SEC_VERB", sectionName: "Verbal Ability", correct: 5, incorrect: 5 }, // Passed (5)
        { sectionKey: "SEC_REAS", sectionName: "Reasoning Ability", correct: 4, incorrect: 6 }, // Failed (4 < 5)
      ],
      objectiveEvalResults: [],
      codingEvalResults: [],
    };

    const result = await strategy.evaluate(context);
    expect(result.qualification).toBe("NOT_QUALIFIED");
    expect(result.qualificationReason).toBe("Sectional cutoff not cleared");
  });

  it("should return NINJA when Foundation Total meets Ninja threshold but is below Digital threshold", async () => {
    const context: HiringEvaluationContext = {
      config: baseConfig,
      sectionScores: [
        { sectionKey: "SEC_NUM", sectionName: "Numerical Ability", correct: 6, incorrect: 4 },
        { sectionKey: "SEC_VERB", sectionName: "Verbal Ability", correct: 6, incorrect: 4 },
        { sectionKey: "SEC_REAS", sectionName: "Reasoning Ability", correct: 6, incorrect: 4 }, // Foundation total = 18 >= 15
      ],
      objectiveEvalResults: [],
      codingEvalResults: [],
    };

    const result = await strategy.evaluate(context);
    expect(result.qualification).toBe("NINJA");
    expect(result.foundationScore).toBe(18);
    expect(result.qualificationReason).toContain("Qualified for Ninja");
  });

  it("should return DIGITAL when Foundation Total, Advanced score, and Coding solved meet Digital requirements", async () => {
    const context: HiringEvaluationContext = {
      config: baseConfig,
      sectionScores: [
        { sectionKey: "SEC_NUM", sectionName: "Numerical Ability", correct: 9, incorrect: 1 },
        { sectionKey: "SEC_VERB", sectionName: "Verbal Ability", correct: 9, incorrect: 1 },
        { sectionKey: "SEC_REAS", sectionName: "Reasoning Ability", correct: 9, incorrect: 1 }, // Foundation total = 27 >= 25
        { sectionKey: "SEC_ADV", sectionName: "Advanced Aptitude", correct: 10, incorrect: 2 }, // Advanced = 10 >= 8
      ],
      objectiveEvalResults: [],
      codingEvalResults: [
        { questionId: "c1", score: 100, isCorrect: true }, // Solved
        { questionId: "c2", score: 50, isCorrect: false }, // Partial
      ],
    };

    const result = await strategy.evaluate(context);
    expect(result.qualification).toBe("DIGITAL");
    expect(result.foundationScore).toBe(27);
    expect(result.advancedScore).toBe(10);
    expect(result.codingSolved).toBe(1);
    expect(result.codingBreakdown.problems[0].status).toBe("SOLVED");
    expect(result.codingBreakdown.problems[1].status).toBe("PARTIAL");
  });

  it("should return PRIME when all Prime thresholds for Foundation, Advanced, and Coding are satisfied", async () => {
    const context: HiringEvaluationContext = {
      config: baseConfig,
      sectionScores: [
        { sectionKey: "SEC_NUM", sectionName: "Numerical Ability", correct: 12, incorrect: 0 },
        { sectionKey: "SEC_VERB", sectionName: "Verbal Ability", correct: 12, incorrect: 0 },
        { sectionKey: "SEC_REAS", sectionName: "Reasoning Ability", correct: 12, incorrect: 0 }, // Foundation total = 36 >= 35
        { sectionKey: "SEC_ADV", sectionName: "Advanced Aptitude", correct: 14, incorrect: 1 }, // Advanced = 14 >= 12
      ],
      objectiveEvalResults: [],
      codingEvalResults: [
        { questionId: "c1", score: 100, isCorrect: true },
        { questionId: "c2", score: 100, isCorrect: true }, // Coding solved = 2 >= 2
      ],
    };

    const result = await strategy.evaluate(context);
    expect(result.qualification).toBe("PRIME");
    expect(result.foundationScore).toBe(36);
    expect(result.advancedScore).toBe(14);
    expect(result.codingSolved).toBe(2);
  });

  it("should fall back to DIGITAL or NINJA if Prime coding requirement is not met", async () => {
    const context: HiringEvaluationContext = {
      config: baseConfig,
      sectionScores: [
        { sectionKey: "SEC_NUM", sectionName: "Numerical Ability", correct: 12, incorrect: 0 },
        { sectionKey: "SEC_VERB", sectionName: "Verbal Ability", correct: 12, incorrect: 0 },
        { sectionKey: "SEC_REAS", sectionName: "Reasoning Ability", correct: 12, incorrect: 0 }, // Foundation = 36 >= 35 (Prime)
        { sectionKey: "SEC_ADV", sectionName: "Advanced Aptitude", correct: 14, incorrect: 1 }, // Advanced = 14 >= 12 (Prime)
      ],
      objectiveEvalResults: [],
      codingEvalResults: [
        { questionId: "c1", score: 100, isCorrect: true },
        { questionId: "c2", score: 0, isCorrect: false }, // Only 1 solved (< 2 required for Prime)
      ],
    };

    const result = await strategy.evaluate(context);
    expect(result.qualification).toBe("DIGITAL"); // Meets Digital requirement (1 coding solved)
  });
});
