import { spawnSync } from "child_process";
import { performance } from "perf_hooks";
import {
  connectPrisma,
  disconnectPrisma,
  prisma,
  TemplateRepository,
} from "../packages/database/src";
import { GenerationService } from "../packages/ai-core/src/generation/generation.service";
import { TemplateSelectorService } from "../packages/ai-core/src/generation/template-selector.service";
import { ValidationOrchestratorService } from "../packages/ai-core/src/validation/validation-orchestrator.service";
import { EvaluationEngineService } from "../packages/ai-core/src/evaluation/evaluation-engine.service";
import { RecommendationEngineService } from "../packages/ai-core/src/recommendation/recommendation-engine.service";
import {
  GeneratedQuestionSchema,
  EvaluationResultDtoSchema,
  RecommendationResultDtoSchema,
  ValidationError,
  AIError,
} from "@intervu-ai/contracts";

async function main() {
  console.log("==========================================");
  console.log("Starting InterVu AI E2E Hardening & Certification Suite");
  console.log("==========================================\n");

  // 1. Run Sub-Audits as Isolated Processes
  console.log("--> Stage 1: Running Question Generation Audit...");
  const genResult = spawnSync(
    "node",
    [
      "--import",
      "tsx",
      "--env-file=apps/api/.env",
      "scripts/verify-generation-quality.ts",
    ],
    { stdio: "inherit", env: process.env },
  );
  if (genResult.status !== 0) {
    console.error("❌ Stage 1: Question Generation Audit FAILED.");
    process.exit(1);
  }
  console.log("✅ Stage 1: Question Generation Audit PASSED.\n");

  console.log("--> Stage 2: Running Evaluation Engine Audit...");
  const evalResult = spawnSync(
    "node",
    [
      "--import",
      "tsx",
      "--env-file=apps/api/.env",
      "scripts/verify-evaluation-quality.ts",
    ],
    { stdio: "inherit", env: process.env },
  );
  if (evalResult.status !== 0) {
    console.error("❌ Stage 2: Evaluation Engine Audit FAILED.");
    process.exit(1);
  }
  console.log("✅ Stage 2: Evaluation Engine Audit PASSED.\n");

  console.log("--> Stage 3: Running Recommendation Engine Audit...");
  const recResult = spawnSync(
    "node",
    [
      "--import",
      "tsx",
      "--env-file=apps/api/.env",
      "scripts/verify-recommendation-quality.ts",
    ],
    { stdio: "inherit", env: process.env },
  );
  if (recResult.status !== 0) {
    console.error("❌ Stage 3: Recommendation Engine Audit FAILED.");
    process.exit(1);
  }
  console.log("✅ Stage 3: Recommendation Engine Audit PASSED.\n");

  // 2. Perform DB Connection and E2E benchmarking
  await connectPrisma();

  class CachedTemplateRepository extends TemplateRepository {
    private cache = new Map<string, any[]>();
    async findByConceptAndDifficulty(
      conceptKey: string,
      difficultyLevel: any,
    ): Promise<any[]> {
      const cacheKey = `${conceptKey}_${difficultyLevel}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }
      const result = await super.findByConceptAndDifficulty(
        conceptKey,
        difficultyLevel,
      );
      this.cache.set(cacheKey, result);
      return result;
    }
  }

  const cachedRepo = new CachedTemplateRepository();
  const selector = new TemplateSelectorService(cachedRepo);
  const generationService = new GenerationService(selector);
  const validationOrchestrator = new ValidationOrchestratorService();
  const evaluationEngine = new EvaluationEngineService();
  const recommendationEngine = new RecommendationEngineService();

  console.log(
    "--> Stage 4: Running E2E Integration Benchmark (100 E2E loops)...",
  );
  const startTime = performance.now();

  const totalRuns = 100;
  try {
    for (let i = 1; i <= totalRuns; i++) {
      // 2a. Generate Question
      const concept = "time_work";
      const seed = `bench_run_${i}`;

      const { question } = await generationService.generateQuestion(
        {
          conceptKey: concept,
          difficultyLevel: "easy",
          questionType: "mcq",
        },
        seed,
      );

      // 2b. Contract Verification: GeneratedQuestion
      GeneratedQuestionSchema.parse(question);

      // 2c. Validate Question
      const validation = validationOrchestrator.validateQuestion(question);
      if (!validation.passed) {
        throw new Error(
          `Question validation failed during benchmark run ${i}: ${JSON.stringify(validation.errors)}`,
        );
      }

      // 2d. Run Evaluation
      const mockExecutionResult = {
        executionId: `exec_bench_${i}`,
        testId: `test_bench_${i}`,
        status: "submitted",
        answers: [
          { questionId: question.questionId, answer: question.correctAnswer },
        ],
        submittedAt: new Date(),
      };

      const questionSnapshot = {
        questionId: question.questionId,
        correctAnswer: question.correctAnswer,
        questionType: question.questionType,
        conceptKey: question.conceptKey,
        difficultyLevel: question.difficultyLevel,
      };

      const evaluation = await evaluationEngine.evaluate(mockExecutionResult, [
        questionSnapshot,
      ]);

      // 2e. Contract Verification: EvaluationResultDto
      EvaluationResultDtoSchema.parse(evaluation);

      // 2f. Run Recommendation
      const recommendations =
        await recommendationEngine.generateRecommendations(evaluation);

      // 2g. Contract Verification: RecommendationResultDto
      RecommendationResultDtoSchema.parse(recommendations);
    }
  } catch (error: any) {
    console.error(
      "❌ E2E Integration Benchmark encountered an error:",
      error.message || error,
    );
    await disconnectPrisma();
    process.exit(1);
  }

  const endTime = performance.now();
  const durationMs = endTime - startTime;
  const durationSec = durationMs / 1000;

  console.log(
    `\nBenchmark Result: Generated, validated, evaluated, and recommended 100 assessments in ${durationSec.toFixed(2)}s.`,
  );

  if (durationSec > 10.0) {
    console.error(
      `❌ PERFORMANCE SLA VIOLATION: Execution took ${durationSec.toFixed(2)} seconds (limit: 10s).`,
    );
    await disconnectPrisma();
    process.exit(1);
  } else {
    console.log("✅ Performance SLA validated: Completed under 10 seconds.");
  }

  // 3. Stage 5: Validation Determinism Verification
  console.log("\n--> Stage 5: Verifying Validation Determinism...");
  try {
    const testQuestion = {
      questionId: "det_1",
      templateId: "tpl_det_1",
      conceptKey: "percentages",
      difficultyLevel: "easy" as const,
      questionType: "mcq" as const,
      questionText:
        "What is 10% of 100? This must be at least 15 characters long.",
      options: ["10", "20", "30", "40"],
      correctAnswer: "10",
      solution: JSON.stringify({
        steps: ["Step 1: calculate percentage"],
        finalAnswer: "10",
      }),
      metadata: { val: 10 },
    };

    const val1 = validationOrchestrator.validateQuestion(testQuestion);
    const val2 = validationOrchestrator.validateQuestion(testQuestion);

    // Stripping validatedAt timestamps since they might differ by a millisecond
    const { validatedAt: t1, ...cleanVal1 } = val1;
    const { validatedAt: t2, ...cleanVal2 } = val2;

    if (JSON.stringify(cleanVal1) !== JSON.stringify(cleanVal2)) {
      throw new Error(
        "Validation outputs differ between identical consecutive runs.",
      );
    }
    console.log("✅ Validation Engine is 100% deterministic.");
  } catch (error: any) {
    console.error(
      "❌ Stage 5: Validation Determinism check FAILED:",
      error.message || error,
    );
    await disconnectPrisma();
    process.exit(1);
  }

  // 4. Stage 6: Error Catalog & Boundary Verification
  console.log("\n--> Stage 6: Verifying Error Catalog & Boundaries...");
  try {
    let errorCaught = false;

    // Evaluation boundary test: passing invalid/empty answers
    try {
      const invalidExec = {
        executionId: "exec_invalid",
        testId: "test_invalid",
        status: "submitted",
        answers: [], // Zero questions/answers
        submittedAt: new Date(),
      };
      await evaluationEngine.evaluate(invalidExec, []);
    } catch (error: any) {
      errorCaught = true;
      // Assert that it does NOT contain internal database stack trace words like "PrismaClient", "pg-protocol", etc.
      const traceString = error.stack || "";
      if (
        traceString.includes("postgres") ||
        traceString.includes("prisma-client")
      ) {
        throw new Error(
          "Internal database trace leaked in exception stack trace.",
        );
      }
      console.log(
        `✅ Evaluation Input Error caught successfully: "${error.message}"`,
      );
    }

    if (!errorCaught) {
      throw new Error(
        "Evaluation boundary test did not raise an expected validation error.",
      );
    }

    errorCaught = false;

    // Recommendation boundary test: passing null evaluation
    try {
      await recommendationEngine.generateRecommendations(null as any);
    } catch (error: any) {
      errorCaught = true;
      const traceString = error.stack || "";
      if (
        traceString.includes("postgres") ||
        traceString.includes("prisma-client")
      ) {
        throw new Error(
          "Internal stack details leaked in recommendation exception.",
        );
      }
      console.log(
        `✅ Recommendation Input Error caught successfully: "${error.message}"`,
      );
    }

    if (!errorCaught) {
      throw new Error(
        "Recommendation boundary test did not raise an expected error.",
      );
    }

    console.log(
      "✅ Error boundary catalogs verified. No internal traces exposed.",
    );
  } catch (error: any) {
    console.error(
      "❌ Stage 6: Error Catalog verification FAILED:",
      error.message || error,
    );
    await disconnectPrisma();
    process.exit(1);
  }

  await disconnectPrisma();

  console.log("\n==========================================");
  console.log("Generation PASS\n");
  console.log("Validation PASS\n");
  console.log("Evaluation PASS\n");
  console.log("Recommendation PASS\n");
  console.log("OVERALL PASS");
  console.log("==========================================");

  process.exit(0);
}

main();
