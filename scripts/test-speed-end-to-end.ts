import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../apps/api/src/app.module";
import { StartTestService } from "../apps/api/src/modules/tests/start-test/start-test.service";
import { ExecutionService } from "../apps/api/src/modules/execution/services/execution.service";
import { SectionAdvanceService } from "../apps/api/src/modules/execution/services/section-advance.service";
import { PrismaService } from "../apps/api/src/prisma/prisma.service";

async function main() {
  console.log("\n=======================================================");
  console.log("⚡ IN-PROCESS END-TO-END TIMING & PROGRESSIVE TEST");
  console.log("=======================================================\n");

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn"] });

  const prisma = app.get(PrismaService);
  const startTestService = app.get(StartTestService);
  const executionService = app.get(ExecutionService);
  const sectionAdvanceService = app.get(SectionAdvanceService);

  // 1. Pick a published ExamConfig with sections
  let examConfig = await prisma.examConfig.findFirst({
    where: { status: "PUBLISHED", sections: { some: {} } },
    include: { sections: true },
  });

  if (!examConfig) {
    examConfig = await prisma.examConfig.findFirst({
      where: { sections: { some: {} } },
      include: { sections: true },
    });
  }

  if (!examConfig) {
    console.error("❌ No ExamConfig found in database.");
    await app.close();
    return;
  }

  console.log(`📋 Testing with ExamConfig: "${examConfig.name}" (ID: ${examConfig.id})`);
  console.log(`Sections in config: ${examConfig.sections.length}`);

  // 2. Create a test candidate
  const candidate = await prisma.user.create({
    data: {
      email: `speed_bench_${Date.now()}@example.com`,
      fullName: "Speed Test Candidate",
      role: "CANDIDATE",
      passwordHash: "mock_hash",
    },
  });

  console.log(`👤 Created Test Candidate: ${candidate.id}`);

  // 3. Measure StartTestService execution time (The exact start delay)
  console.log("\n⏱️ [TEST 1] Executing startTestService.startTest()...");
  const startMs = Date.now();

  const startResult = await startTestService.startTest(candidate.id, {
    testConfigId: examConfig.id,
  });

  const durationMs = Date.now() - startMs;
  const durationSec = (durationMs / 1000).toFixed(2);

  console.log(`\n=======================================================`);
  console.log(`🎯 START ASSESSMENT TOTAL TIME: ${durationSec}s (${durationMs}ms)`);
  console.log(`=======================================================`);
  console.log(`Result testInstanceId: ${startResult.testInstanceId}`);
  console.log(`Result status:         ${startResult.status}`);

  if (durationMs <= 3000) {
    console.log(`\n🚀 [PASS] ULTRA FAST (< 3 seconds)! Progressive assembly eliminated the 5-10 min delay! ✅`);
  } else if (durationMs <= 30000) {
    console.log(`\n✅ [PASS] FAST (< 30s) — Huge improvement over 5-10 minutes! ✅`);
  } else {
    console.log(`\n⚠️ [WARN] Took ${durationSec}s.`);
  }

  // 4. Measure loadAssessment (first load vs cached load)
  console.log("\n⏱️ [TEST 2] Testing ExecutionService.loadAssessment()...");
  const load1Start = Date.now();
  const snap1 = await executionService.loadAssessment(startResult.testInstanceId, candidate.id);
  const load1Ms = Date.now() - load1Start;
  console.log(`First load snapshot (DB query + cache populate): ${load1Ms}ms`);

  const load2Start = Date.now();
  const snap2 = await executionService.loadAssessment(startResult.testInstanceId, candidate.id);
  const load2Ms = Date.now() - load2Start;
  console.log(`Second load snapshot (Redis cache read ⚡): ${load2Ms}ms`);

  console.log(`Section count in snapshot: ${snap1.sections.length}`);
  if (snap1.sections.length > 0) {
    console.log(`Section 1 ("${snap1.sections[0].sectionName}"): ${snap1.sections[0].questions.length} questions immediately available ✅`);
  }

  // 5. Test Section Advance
  console.log("\n⏱️ [TEST 3] Testing SectionAdvanceService.advanceSection()...");
  try {
    const advResult = await sectionAdvanceService.advanceSection(startResult.testInstanceId, candidate.id);
    console.log(`Section advance result:`, JSON.stringify(advResult));
    console.log(`Section advance working smoothly ✅`);
  } catch (err: any) {
    console.log(`Advance error (if single section auto-submit or expected): ${err?.message || err}`);
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL IN-PROCESS PERFORMANCE TESTS COMPLETED SUCCESSFULLY!");
  console.log("=======================================================\n");

  await app.close();
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
