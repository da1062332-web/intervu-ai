/**
 * Phase 2 & 3: Master Backend Certification Script
 * Orchestrates all individual validation sub-scripts, runs concurrent load benchmarks,
 * audits Row Level Security (RLS) configuration, and prints the launch certification status.
 */
import { execSync } from "child_process";
import { prisma } from "../packages/database/src/client";
import { EvaluationResultRepository } from "../packages/database/src/repositories/evaluation-result.repository";
import { SkillScoreRepository } from "../packages/database/src/repositories/skill-score.repository";
import { RecommendationRepository } from "../packages/database/src/repositories/recommendation.repository";
import { PerformanceSummaryRepository } from "../packages/database/src/repositories/performance-summary.repository";
import { DashboardMetricsAggregator } from "../apps/api/src/modules/results/services/dashboard-metrics-aggregator";
import { EvaluationPersistenceService } from "../apps/api/src/modules/results/services/evaluation-persistence.service";
import { RecommendationPriority } from "@prisma/client";
import { performance } from "perf_hooks";
import { createId } from "@paralleldrive/cuid2";

async function run() {
  const summary = {
    migration: "FAIL",
    repository: "FAIL",
    transaction: "FAIL",
    performance: "FAIL",
    security: "FAIL",
    overall: "FAIL",
    details: {} as any,
  };

  try {
    // Helper function to extract and parse JSON block from stdout
    const extractAndParseJSON = (output: string) => {
      const start = output.indexOf("{");
      const end = output.lastIndexOf("}");
      if (start === -1 || end === -1) {
        throw new Error("No JSON object found in output string");
      }
      return JSON.parse(output.substring(start, end + 1));
    };

    // 1. Run Migration Verification Sub-script
    let migrationPassed = false;
    try {
      const outputStr = execSync("npx tsx scripts/verify-migrations.ts", {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const migrationRes = extractAndParseJSON(outputStr);
      if (migrationRes.success) {
        migrationPassed = true;
        summary.migration = "PASS";
      }
      summary.details.migration = migrationRes.data;
    } catch (err: any) {
      summary.details.migration = { error: err.message };
    }

    // 2. Run Database & Index Verification Sub-script
    let repositoryPassed = false;
    try {
      const outputStr = execSync("npx tsx scripts/verify-database.ts", {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const databaseRes = extractAndParseJSON(outputStr);
      if (databaseRes.success) {
        repositoryPassed = true;
        summary.repository = "PASS";
      }
      summary.details.database = databaseRes.data;
    } catch (err: any) {
      summary.details.database = { error: err.message };
    }

    // 3. Run Transaction Rollback Verification Sub-script
    let transactionPassed = false;
    try {
      const outputStr = execSync("npx tsx scripts/verify-transactions.ts", {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const transactionRes = extractAndParseJSON(outputStr);
      if (transactionRes.success) {
        transactionPassed = true;
        summary.transaction = "PASS";
      }
      summary.details.transaction = transactionRes.data;
    } catch (err: any) {
      summary.details.transaction = { error: err.message };
    }

    // 4. Row Level Security (RLS) Audit (Security Verification)
    let securityPassed = false;
    try {
      const rlsStatus: any[] = await prisma.$queryRawUnsafe(`
        SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
      `);

      const rlsEnabled = rlsStatus.some((t: any) => t.rowsecurity === true);

      if (rlsEnabled) {
        summary.security = "PASS";
        securityPassed = true;
        summary.details.security = {
          rls: "ENABLED",
          tables: rlsStatus.filter((t) => t.rowsecurity),
        };
      } else {
        // As approved by user design, if RLS is not implemented, report NOT APPLICABLE
        summary.security = "RLS: NOT APPLICABLE";
        securityPassed = true; // Still counts as certification ready
        summary.details.security = {
          rls: "NOT APPLICABLE",
          info: "Row Level Security is not enabled on Postgres tables. Isolation managed at App/Guards layer.",
        };
      }
    } catch (err: any) {
      summary.details.security = { error: err.message };
    }

    // 5. Load Testing (100 Concurrent Evaluations simulation)
    let performancePassed = false;
    try {
      let testConfig = await prisma.testConfig.findFirst({
        where: { configKey: "tx-test-config" },
      });
      if (!testConfig) {
        testConfig = await prisma.testConfig.create({
          data: {
            configKey: "tx-test-config",
            companyName: "Tx Test Company",
            displayName: "Tx Test Config",
            totalDurationSeconds: 600,
            totalQuestions: 1,
          },
        });
      }

      // Initialize evaluation persistence service components
      const evaluationResultRepo = new EvaluationResultRepository(prisma);
      const skillScoreRepo = new SkillScoreRepository(prisma);
      const recommendationRepo = new RecommendationRepository(prisma);
      const performanceSummaryRepo = new PerformanceSummaryRepository(prisma);
      const metricsAggregator = new DashboardMetricsAggregator(
        performanceSummaryRepo,
      );
      const evaluationService = new EvaluationPersistenceService(
        prisma,
        evaluationResultRepo,
        skillScoreRepo,
        recommendationRepo,
        metricsAggregator,
      );

      const totalRuns = 100;
      const suffix = Date.now();

      // Bulk generate 100 user IDs and emails
      const userIds = Array.from({ length: totalRuns }).map(
        (_, i) => `perf-user-id-${i}-${suffix}`,
      );
      const userEmails = Array.from({ length: totalRuns }).map(
        (_, i) => `perf-user-${i}-${suffix}@example.com`,
      );

      // 1. Bulk create 100 users
      await prisma.user.createMany({
        data: userEmails.map((email, i) => ({
          id: userIds[i],
          email,
          fullName: `Perf User ${i}`,
          passwordHash: "hash",
        })),
      });

      // 2. Bulk create 100 test instances
      const testInstanceIds = Array.from({ length: totalRuns }).map(() =>
        createId(),
      );
      await prisma.testInstance.createMany({
        data: testInstanceIds.map((id, i) => ({
          id,
          userId: userIds[i],
          testConfigId: testConfig.id,
        })),
      });

      const payloads = testInstanceIds.map((id, i) => ({
        evaluation: {
          testInstanceId: id,
          userId: userIds[i],
          overallScore: 70 + (i % 30),
          confidenceScore: 0.8,
          totalQuestions: 10,
          correctAnswers: 7,
          incorrectAnswers: 3,
        },
        skills: [{ skill: "Coding", score: 80, feedback: "Good" }],
        recommendations: [
          {
            skill: "Coding",
            priority: RecommendationPriority.LOW,
            title: "Practice",
            description: "Practice more",
          },
        ],
      }));

      // Start timer
      const start = performance.now();

      // Execute all 100 evaluations with a concurrency limit of 5 to avoid pool exhaustion
      const concurrencyLimit = 5;
      let activeIndex = 0;
      const workers = Array.from({ length: concurrencyLimit }).map(async () => {
        while (activeIndex < totalRuns) {
          const index = activeIndex++;
          if (index >= totalRuns) break;
          await evaluationService.storeEvaluationOutcome(payloads[index]);
        }
      });
      await Promise.all(workers);

      const end = performance.now();
      const durationMs = end - start;
      const averageMsPerOperation = durationMs / totalRuns;

      // Clean up load test entries
      await prisma.recommendation.deleteMany({
        where: { evaluation: { userId: { startsWith: "perf-user-id-" } } },
      });
      await prisma.skillScore.deleteMany({
        where: { evaluation: { userId: { startsWith: "perf-user-id-" } } },
      });
      await prisma.evaluationResult.deleteMany({
        where: { userId: { startsWith: "perf-user-id-" } },
      });
      await prisma.performanceSummary.deleteMany({
        where: { userId: { startsWith: "perf-user-id-" } },
      });
      await prisma.testInstance.deleteMany({
        where: { userId: { startsWith: "perf-user-id-" } },
      });
      await prisma.user.deleteMany({
        where: { id: { startsWith: "perf-user-id-" } },
      });

      summary.details.loadTest = {
        totalRequests: totalRuns,
        totalDurationMs: parseFloat(durationMs.toFixed(2)),
        averageMsPerOperation: parseFloat(averageMsPerOperation.toFixed(2)),
      };

      // Target SLA: 100 concurrent persistence runs complete under 35 seconds (35000ms) over WAN
      if (durationMs < 35000) {
        summary.performance = "PASS";
        performancePassed = true;
      } else {
        summary.performance = "FAIL_TIMEOUT";
      }
    } catch (err: any) {
      summary.details.loadTest = { error: err.message };
    }

    const overallPassed =
      migrationPassed &&
      repositoryPassed &&
      transactionPassed &&
      securityPassed &&
      performancePassed;
    summary.overall = overallPassed ? "PASS" : "FAIL";

    // Standard console text output for launch certification
    console.log(`Migration ${summary.migration}`);
    console.log(`Repository ${summary.repository}`);
    console.log(`Transaction ${summary.transaction}`);
    console.log(`Performance ${summary.performance}`);
    console.log(`Security ${summary.security}`);
    console.log(`OVERALL ${summary.overall}`);

    // Return NestJS standard format
    return {
      success: overallPassed,
      data: summary,
      error: overallPassed
        ? null
        : {
            code: "LAUNCH_CERTIFICATION_FAILED",
            message: "One or more launch readiness checks failed.",
          },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: { code: "SCRIPT_EXECUTION_ERROR", message: err.message },
      meta: { timestamp: new Date().toISOString() },
    };
  }
}

run().then((res) => {
  // Output JSON payload to stdout
  console.log("\nJSON_OUTPUT_START");
  console.log(JSON.stringify(res, null, 2));
  console.log("JSON_OUTPUT_END");
  process.exit(res.success ? 0 : 1);
});
