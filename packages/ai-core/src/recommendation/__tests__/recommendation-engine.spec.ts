import { RecommendationEngineService } from "../recommendation-engine.service";
import { EvaluationResultDto } from "@intervu-ai/contracts";
import { RecommendationValidatorService } from "../recommendation-validator.service";

describe("Recommendation Engine Unit & Performance Tests", () => {
  let engine: RecommendationEngineService;

  beforeEach(() => {
    engine = new RecommendationEngineService();
  });

  const createMockEvaluation = (
    skillScores: Record<string, number>,
    feedback: string[],
    evaluationId?: string,
  ): EvaluationResultDto => {
    return {
      evaluationId: evaluationId || "eval_mock_123",
      overallScore: 75,
      confidenceScore: 100,
      skillScores,
      feedback,
      evaluatedAt: new Date(),
    };
  };

  test("REC-001: Single Weak Skill and Concept", async () => {
    const evaluation = createMockEvaluation(
      { aptitude: 40, reasoning: 85 }, // aptitude is weak (< 50)
      ["Needs improvement in Percentages.", "Strong in Probability."], // Percentages is weak
    );

    const result = await engine.generateRecommendations(evaluation);

    expect(result.recommendations.length).toBeGreaterThan(0);

    // Check that we got a HIGH priority recommendation for Percentages or Aptitude
    const highRecs = result.recommendations.filter(
      (r) => r.priority === "HIGH",
    );
    expect(highRecs.length).toBe(2); // both percentages (score 40) and aptitude (score 40)
    expect(highRecs.map((r) => r.skill)).toContain("percentages");
    expect(highRecs.map((r) => r.skill)).toContain("aptitude");
  });

  test("REC-002: Multiple Weak Skills / Concepts sorting", async () => {
    const evaluation = createMockEvaluation(
      { aptitude: 40, reasoning: 55 }, // aptitude: HIGH (< 50), reasoning: MEDIUM (50-70)
      [
        "Needs improvement in Percentages.",
        "Needs improvement in Probability.",
      ], // Percentages: HIGH, Probability: HIGH
    );

    const result = await engine.generateRecommendations(evaluation);

    // High priority recommendations should come first
    expect(result.recommendations[0].priority).toBe("HIGH");
    expect(result.recommendations[1].priority).toBe("HIGH");
    expect(result.recommendations[2].priority).toBe("HIGH");
    expect(result.recommendations[3].priority).toBe("MEDIUM"); // reasoning (55)
    expect(result.recommendations[3].skill).toBe("reasoning");
  });

  test("REC-003: No Weak Skills / Concepts", async () => {
    const evaluation = createMockEvaluation(
      { aptitude: 85, reasoning: 90 }, // all strong (> 70)
      ["Strong in Percentages.", "Strong in Probability."],
    );

    const result = await engine.generateRecommendations(evaluation);

    // All recommendations should be LOW priority
    for (const rec of result.recommendations) {
      expect(rec.priority).toBe("LOW");
    }
  });

  test("REC-004: Priority Ranking Order (HIGH -> MEDIUM -> LOW)", async () => {
    const evaluation = createMockEvaluation(
      { aptitude: 35, reasoning: 85 }, // aptitude: HIGH, reasoning: LOW
      [
        "Needs improvement in Percentages.",
        "Needs improvement in Probability.",
      ], // Percentages: HIGH, Probability: HIGH
    );
    // Let's manually inject a MEDIUM concept by tweaking feedback parsing mapping logic if we want,
    // or just checking that HIGH is before LOW.
    const result = await engine.generateRecommendations(evaluation);

    expect(result.recommendations.length).toBe(4);
    expect(result.recommendations[0].priority).toBe("HIGH");
    expect(result.recommendations[1].priority).toBe("HIGH");
    expect(result.recommendations[2].priority).toBe("HIGH");
    expect(result.recommendations[3].priority).toBe("LOW");
  });

  test("REC-005: Validation and duplicate checks", async () => {
    // Make sure we reject invalid evaluation inputs or duplicates
    await expect(
      engine.generateRecommendations(null as unknown as EvaluationResultDto),
    ).rejects.toThrow();

    // Trigger duplicate check: if validator receives duplicate recommendation for a skill/concept, it fails.
    // Let's test validator directly.
    const validator = new RecommendationValidatorService();
    const mockOutput = {
      recommendations: [
        {
          recommendationId: "rec_1",
          skill: "percentages",
          priority: "HIGH" as const,
          title: "Title 1",
          description: "Desc 1",
        },
        {
          recommendationId: "rec_2",
          skill: "percentages", // Duplicate skill
          priority: "HIGH" as const,
          title: "Title 2",
          description: "Desc 2",
        },
      ],
    };
    const check = validator.validate(mockOutput);
    expect(check.isValid).toBe(false);
    expect(
      check.errors.some((e: string) => e.includes("Duplicate recommendation")),
    ).toBe(true);
  });

  test("Performance Testing: Generate recommendations for 100 evaluations under 5 seconds", async () => {
    const evaluations: EvaluationResultDto[] = [];
    for (let i = 0; i < 100; i++) {
      evaluations.push(
        createMockEvaluation(
          { aptitude: (i * 7) % 100, reasoning: (i * 9) % 100 },
          i % 2 === 0
            ? ["Needs improvement in Percentages.", "Strong in Probability."]
            : ["Strong in Percentages.", "Needs improvement in Probability."],
          `eval_perf_${i}`,
        ),
      );
    }

    const start = Date.now();
    const batchResult = await engine.generateBatchRecommendations(evaluations);
    const duration = Date.now() - start;

    expect(Object.keys(batchResult).length).toBe(100);
    expect(duration).toBeLessThan(5000); // 5 seconds SLA target
    console.log(
      `[Performance Report] Generated recommendations for 100 evaluations in ${duration}ms`,
    );
  });
});
