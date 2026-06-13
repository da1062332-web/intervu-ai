import { RecommendationEngineService } from "../packages/ai-core/src/recommendation/recommendation-engine.service";
import { EvaluationResultDto } from "@intervu-ai/contracts";

async function runAudit() {
  console.log("==========================================");
  console.log("Running Recommendation Accuracy Audit");
  console.log("==========================================\n");

  const recommendationEngine = new RecommendationEngineService();
  let passes = 0;
  let failures = 0;

  // Mock scenarios
  const testCases: Array<{
    name: string;
    evaluation: EvaluationResultDto;
    expectedSkillsWithPriorities: Record<string, "HIGH" | "MEDIUM" | "LOW">;
  }> = [
    {
      name: "Case 1: Low reasoning, High aptitude",
      evaluation: {
        evaluationId: "eval_test_1",
        overallScore: 70,
        confidenceScore: 100,
        skillScores: {
          aptitude: 90,
          reasoning: 45,
        },
        feedback: [
          "Strong in Percentages.",
          "Needs improvement in Probability.",
        ],
        evaluatedAt: new Date(),
      },
      expectedSkillsWithPriorities: {
        // aptitude (90) -> score > 70 -> LOW
        // reasoning (45) -> score < 50 -> HIGH
        // percentages -> Strong in Percentages (85) -> score > 70 -> LOW
        // probability -> Needs improvement in Probability (40) -> score < 50 -> HIGH
        reasoning: "HIGH",
        probability: "HIGH",
        aptitude: "LOW",
        percentages: "LOW",
      },
    },
    {
      name: "Case 2: Medium scores for both",
      evaluation: {
        evaluationId: "eval_test_2",
        overallScore: 60,
        confidenceScore: 100,
        skillScores: {
          aptitude: 65,
          reasoning: 60,
        },
        feedback: [
          "Needs improvement in Time and Work.",
          "Needs improvement in Averages.",
        ],
        evaluatedAt: new Date(),
      },
      expectedSkillsWithPriorities: {
        // aptitude (65) -> MEDIUM
        // reasoning (60) -> MEDIUM
        // time_work -> Needs improvement in Time & Work (40) -> HIGH
        // averages -> Needs improvement in Averages (40) -> HIGH
        time_work: "HIGH",
        averages: "HIGH",
        aptitude: "MEDIUM",
        reasoning: "MEDIUM",
      },
    },
    {
      name: "Case 3: All strong areas (all LOW priority)",
      evaluation: {
        evaluationId: "eval_test_3",
        overallScore: 95,
        confidenceScore: 100,
        skillScores: {
          aptitude: 95,
          reasoning: 100,
        },
        feedback: [
          "Strong in Profit and Loss.",
          "Strong in Probability.",
        ],
        evaluatedAt: new Date(),
      },
      expectedSkillsWithPriorities: {
        aptitude: "LOW",
        reasoning: "LOW",
        profit_loss: "LOW",
        probability: "LOW",
      },
    },
    {
      name: "Case 4: Critical weaknesses (all HIGH priority)",
      evaluation: {
        evaluationId: "eval_test_4",
        overallScore: 30,
        confidenceScore: 100,
        skillScores: {
          aptitude: 35,
          reasoning: 20,
        },
        feedback: [
          "Needs improvement in Percentages.",
          "Needs improvement in Probability.",
        ],
        evaluatedAt: new Date(),
      },
      expectedSkillsWithPriorities: {
        aptitude: "HIGH",
        reasoning: "HIGH",
        percentages: "HIGH",
        probability: "HIGH",
      },
    },
  ];

  for (let idx = 0; idx < testCases.length; idx++) {
    const testCase = testCases[idx];
    console.log(`Checking Scenario #${idx + 1}: ${testCase.name}`);

    try {
      const result = await recommendationEngine.generateRecommendations(testCase.evaluation);
      const recs = result.recommendations;

      // 1. Confirm basic shape
      if (!recs || !Array.isArray(recs)) {
        throw new Error("Result recommendations is not a valid array.");
      }

      // 2. Confirm Priorities, Skill mappings, and duplicates
      const seenIds = new Set<string>();
      const seenSkills = new Set<string>();
      
      let caseFailed = false;

      for (const rec of recs) {
        // Check duplicate recommendationId
        if (seenIds.has(rec.recommendationId)) {
          console.error(`   ❌ Duplicate recommendationId: ${rec.recommendationId}`);
          caseFailed = true;
        }
        seenIds.add(rec.recommendationId);

        // Check duplicate skill recommendation
        if (seenSkills.has(rec.skill)) {
          console.error(`   ❌ Duplicate recommendation for skill: ${rec.skill}`);
          caseFailed = true;
        }
        seenSkills.add(rec.skill);

        // Check expected priority
        const expectedPriority = testCase.expectedSkillsWithPriorities[rec.skill];
        if (!expectedPriority) {
          console.error(`   ❌ Unexpected skill recommendation: ${rec.skill}`);
          caseFailed = true;
        } else if (rec.priority !== expectedPriority) {
          console.error(`   ❌ Priority mismatch for skill ${rec.skill}: Expected ${expectedPriority}, got ${rec.priority}`);
          caseFailed = true;
        }
      }

      // Ensure all expected skills are actually present
      for (const expectedSkill of Object.keys(testCase.expectedSkillsWithPriorities)) {
        if (!seenSkills.has(expectedSkill)) {
          console.error(`   ❌ Missing expected recommendation for skill/concept: ${expectedSkill}`);
          caseFailed = true;
        }
      }

      // 3. Confirm Sorted Order (HIGH -> MEDIUM -> LOW, then alphabetical by skill)
      const priorityWeights = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      for (let r = 0; r < recs.length - 1; r++) {
        const current = recs[r];
        const next = recs[r + 1];

        const weightCurrent = priorityWeights[current.priority];
        const weightNext = priorityWeights[next.priority];

        if (weightCurrent < weightNext) {
          console.error(`   ❌ Sorting Order Violation: Priority ${current.priority} appears before ${next.priority}`);
          caseFailed = true;
        } else if (weightCurrent === weightNext) {
          if (current.skill.localeCompare(next.skill) > 0) {
            console.error(`   ❌ Alphabetical Sorting Violation within priority ${current.priority}: Skill "${current.skill}" appears before "${next.skill}"`);
            caseFailed = true;
          }
        }
      }

      if (caseFailed) {
        failures++;
      } else {
        passes++;
      }

    } catch (err: any) {
      failures++;
      console.error(`   ❌ Scenario #${idx + 1} failed with exception:`, err.message || err);
    }
  }

  console.log("==========================================");
  console.log("Recommendation Audit Summary");
  console.log(`PASS: ${passes} / FAIL: ${failures}`);
  console.log("==========================================\n");

  if (failures > 0) {
    console.error("❌ RECOMMENDATION ACCURACY AUDIT FAILED");
    process.exit(1);
  } else {
    console.log("RECOMMENDATION PASS");
    process.exit(0);
  }
}

runAudit();
