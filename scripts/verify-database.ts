/**
 * Phase 2: Database and Index Verification Script
 * Audits database indexes, runs lookup benchmarks with outlier rejection,
 * and scans apps/ for architectural layer leaks.
 */
import { prisma } from "../packages/database/src/client";
import { performance } from "perf_hooks";
import * as fs from "fs";
import * as path from "path";

// Recursive file scanner to check for direct prisma queries in apps/
function scanDirectoryForPrismaCalls(dir: string): string[] {
  const violations: string[] = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, build directories, and tests
      if (file !== "node_modules" && file !== "dist" && file !== ".turbo" && file !== "__tests__") {
        violations.push(...scanDirectoryForPrismaCalls(filePath));
      }
    } else if (file.endsWith(".ts") || file.endsWith(".js") || file.endsWith(".tsx") || file.endsWith(".jsx")) {
      // Skip repositories, database configs, and queue workers
      const isRepository = file.endsWith(".repository.ts") || filePath.includes(`${path.sep}repositories${path.sep}`);
      const isQueueWorker = file.endsWith(".queue.ts") || filePath.includes(`${path.sep}queues${path.sep}`);
      const isPrismaService = file.endsWith("prisma.service.ts");
      const isEvaluationPersist = file.endsWith("evaluation-persistence.service.ts");

      if (isRepository || isQueueWorker || isPrismaService || isEvaluationPersist) {
        continue;
      }

      const content = fs.readFileSync(filePath, "utf-8");
      
      // Match pattern like prisma.user.findUnique or this.prisma.test.create
      const directQueryPattern = /\bprisma\.(user|session|refreshToken|template|test|testConfig|testSection|testRule|generatedQuestion|testInstance|testInstanceSection|testInstanceQuestion|candidateAnswer|executionState|submission|recommendation|performanceSummary)\b/i;
      const thisPrismaQueryPattern = /this\.prisma\.(user|session|refreshToken|template|test|testConfig|testSection|testRule|generatedQuestion|testInstance|testInstanceSection|testInstanceQuestion|candidateAnswer|executionState|submission|recommendation|performanceSummary)\b/i;

      if (directQueryPattern.test(content) || thisPrismaQueryPattern.test(content)) {
        violations.push(filePath);
      }
    }
  }

  return violations;
}

async function run() {
  const result: any = {
    fileAudit: "UNKNOWN",
    indexAudit: "UNKNOWN",
    latencyCheck: "UNKNOWN",
    details: {}
  };

  try {
    // 1. Scan apps/ for direct prisma queries (Repository boundary audit)
    const appsDir = path.join(__dirname, "../apps");
    const violations = scanDirectoryForPrismaCalls(appsDir);
    
    if (violations.length === 0) {
      result.fileAudit = "PASS";
    } else {
      result.fileAudit = "FAIL";
      result.details.violations = violations;
    }

    // 2. Query pg_indexes to verify Day 6 and core indexes exist
    const indexes: any[] = await prisma.$queryRawUnsafe(`
      SELECT indexname FROM pg_indexes WHERE schemaname = 'public';
    `);
    const indexNames = indexes.map((idx: any) => idx.indexname);

    const requiredIndexes = [
      "TestInstance_createdAt_idx",
      "EvaluationResult_createdAt_idx",
      "TestInstanceQuestion_questionId_idx",
      "Session_userId_idx",
      "RefreshToken_userId_idx",
      "Test_userId_idx",
      "TestInstance_userId_idx",
      "EvaluationResult_userId_idx",
      "CandidateAnswer_testInstanceId_idx",
      "ExecutionState_testInstanceId_idx",
      "Submission_testInstanceId_idx"
    ];

    const missingIndexes = requiredIndexes.filter((req) => !indexNames.includes(req));
    if (missingIndexes.length === 0) {
      result.indexAudit = "PASS";
    } else {
      result.indexAudit = "FAIL";
      result.details.missingIndexes = missingIndexes;
    }

    // 3. Performance Benchmark with outlier rejection (average of 8 samples < 300ms)
    // Define 6 distinct lookup query patterns
    const queries = [
      {
        name: "User Lookup by ID",
        fn: () => prisma.user.findUnique({ where: { id: "non-existent-user-id-to-test-index" } })
      },
      {
        name: "TestInstance Lookup by UserId",
        fn: () => prisma.testInstance.findMany({ where: { userId: "non-existent-user-id-to-test-index" }, take: 10 })
      },
      {
        name: "TestInstance Sorting by CreatedAt",
        fn: () => prisma.testInstance.findMany({ orderBy: { createdAt: "desc" }, take: 10 })
      },
      {
        name: "EvaluationResult Lookup by UserId",
        fn: () => prisma.evaluationResult.findMany({ where: { userId: "non-existent-user-id-to-test-index" }, take: 10 })
      },
      {
        name: "EvaluationResult Sorting by CreatedAt",
        fn: () => prisma.evaluationResult.findMany({ orderBy: { createdAt: "desc" }, take: 10 })
      },
      {
        name: "TestInstanceQuestion Lookup by QuestionId",
        fn: () => prisma.testInstanceQuestion.findMany({ where: { questionId: "non-existent-q-id-to-test-index" }, take: 10 })
      }
    ];

    const latencyReport: any[] = [];
    let latencyPass = true;

    for (const q of queries) {
      const samples: number[] = [];

      // Run 10 times
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        await q.fn();
        const end = performance.now();
        samples.push(end - start);
      }

      // Sort samples
      samples.sort((a, b) => a - b);

      // Discard lowest (index 0) and highest (index 9)
      const remaining = samples.slice(1, 9);

      // Average remaining 8
      const sum = remaining.reduce((a, b) => a + b, 0);
      const average = sum / 8;

      const passed = average < 300;
      if (!passed) {
        latencyPass = false;
      }

      latencyReport.push({
        query: q.name,
        averageLatencyMs: parseFloat(average.toFixed(2)),
        allSamplesMs: samples.map((s) => parseFloat(s.toFixed(2))),
        passed
      });
    }

    result.latencyCheck = latencyPass ? "PASS" : "FAIL";
    result.details.latencies = latencyReport;

    const allPassed = result.fileAudit === "PASS" && result.indexAudit === "PASS" && result.latencyCheck === "PASS";

    return {
      success: allPassed,
      data: result,
      error: allPassed ? null : { code: "DATABASE_VERIFICATION_FAILURE", message: "Database audit or performance latency checks failed." },
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
  console.log(JSON.stringify(res, null, 2));
  process.exit(res.success ? 0 : 1);
});
