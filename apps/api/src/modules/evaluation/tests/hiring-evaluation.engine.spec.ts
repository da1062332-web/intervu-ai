import { HiringEvaluationEngine } from "../services/hiring-evaluation.engine";
import { HiringStrategyRegistry } from "../strategies/hiring-strategy.registry";
import { TcsHiringStrategy } from "../strategies/tcs-hiring.strategy";

describe("HiringEvaluationEngine", () => {
  let engine: HiringEvaluationEngine;
  let prismaMock: any;
  let registry: HiringStrategyRegistry;
  let tcsStrategy: TcsHiringStrategy;

  beforeEach(() => {
    tcsStrategy = new TcsHiringStrategy();
    registry = new HiringStrategyRegistry(tcsStrategy);

    prismaMock = {
      testInstance: {
        findUnique: jest.fn(),
      },
      hiringEvaluationConfig: {
        findUnique: jest.fn(),
      },
    };

    engine = new HiringEvaluationEngine(prismaMock as any, registry);
  });

  it("should return null if test instance has no associated config ID", async () => {
    prismaMock.testInstance.findUnique.mockResolvedValue(null);

    const result = await engine.evaluateAttempt("att_1", [], [], []);
    expect(result).toBeNull();
  });

  it("should return null if hiring evaluation config does not exist or is disabled", async () => {
    prismaMock.testInstance.findUnique.mockResolvedValue({
      id: "att_1",
      examConfigId: "cfg_1",
    });
    prismaMock.hiringEvaluationConfig.findUnique.mockResolvedValue({
      id: "hcfg_1",
      examConfigId: "cfg_1",
      enabled: false, // Disabled
    });

    const result = await engine.evaluateAttempt("att_1", [], [], []);
    expect(result).toBeNull();
  });

  it("should execute strategy and return qualification outcome when enabled", async () => {
    prismaMock.testInstance.findUnique.mockResolvedValue({
      id: "att_1",
      examConfigId: "cfg_1",
    });
    prismaMock.hiringEvaluationConfig.findUnique.mockResolvedValue({
      id: "hcfg_1",
      examConfigId: "cfg_1",
      strategy: "TCS",
      enabled: true,
      ninjaThreshold: 10,
      digitalThreshold: 20,
      primeThreshold: 30,
      advancedDigitalMin: 5,
      advancedPrimeMin: 10,
      codingTotalProblems: 2,
      codingDigitalMinSolved: 1,
      codingPrimeMinSolved: 2,
      sectionMappings: [
        {
          sectionCode: "SEC_NUM",
          sectionName: "Numerical",
          mappingType: "NUMERICAL",
          minimumCorrectAnswers: 3,
        },
        {
          sectionCode: "SEC_VERB",
          sectionName: "Verbal",
          mappingType: "VERBAL",
          minimumCorrectAnswers: 3,
        },
        {
          sectionCode: "SEC_REAS",
          sectionName: "Reasoning",
          mappingType: "REASONING",
          minimumCorrectAnswers: 3,
        },
      ],
    });

    const result = await engine.evaluateAttempt(
      "att_1",
      [
        {
          sectionKey: "SEC_NUM",
          sectionName: "Numerical",
          correct: 5,
          incorrect: 0,
        },
        {
          sectionKey: "SEC_VERB",
          sectionName: "Verbal",
          correct: 5,
          incorrect: 0,
        },
        {
          sectionKey: "SEC_REAS",
          sectionName: "Reasoning",
          correct: 5,
          incorrect: 0,
        },
      ],
      [],
      [],
    );

    expect(result).not.toBeNull();
    expect(result?.strategy).toBe("TCS");
    expect(result?.qualification).toBe("NINJA"); // Total = 15 >= 10
  });
});
