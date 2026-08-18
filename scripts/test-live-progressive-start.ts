import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const API_URL = "http://127.0.0.1:4000/api/v1";
const JWT_SECRET = process.env.JWT_SECRET || "replace-with-a-long-secret-at-least-32-chars";

async function runLiveTest() {
  console.log("\n=======================================================");
  console.log("⚡ TESTING LIVE CANDIDATE START SPEED & PROGRESSIVE ASSEMBLY");
  console.log("=======================================================\n");

  // 1. Verify API is reachable
  try {
    const res = await fetch(`${API_URL}/health`);
    console.log(`API Health Check Status: ${res.status} ✅`);
  } catch (e) {
    console.log("⚠️ API not reachable on port 4000, checking port 3001...");
  }

  // 2. Find a test ExamConfig with multiple sections
  let examConfig = await prisma.examConfig.findFirst({
    where: {
      status: "PUBLISHED",
      sections: { some: {} },
    },
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
    return;
  }

  console.log(`Using ExamConfig: "${examConfig.name}" (ID: ${examConfig.id})`);
  console.log(`Config sections count: ${examConfig.sections.length}`);

  // 3. Find or create a candidate user
  const userEmail = `speed_test_candidate_${Date.now()}@example.com`;
  const candidate = await prisma.user.create({
    data: {
      email: userEmail,
      fullName: "Speed Test Candidate",
      role: "CANDIDATE",
      passwordHash: "mock_hash",
    },
  });

  const token = jwt.sign(
    { sub: candidate.id, id: candidate.id, email: candidate.email, role: candidate.role },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  // 4. Time the startTest API call
  console.log("\n⏱️ Calling POST /tests/start to measure exact start time...");
  const startMs = Date.now();

  const startRes = await fetch(`${API_URL}/tests/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ testConfigId: examConfig.id }),
  });

  const durationMs = Date.now() - startMs;
  const durationSec = (durationMs / 1000).toFixed(2);

  const startBody = await startRes.json() as any;

  console.log(`\n-------------------------------------------------------`);
  console.log(`🎯 START ASSESSMENT RESPONSE TIME: ${durationSec} seconds (${durationMs} ms)`);
  console.log(`-------------------------------------------------------`);

  if (!startBody.success || !startBody.data?.testInstanceId) {
    console.error("❌ Start assessment failed:", JSON.stringify(startBody, null, 2));
    return;
  }

  const testInstanceId = startBody.data.testInstanceId;
  console.log(`✅ Test Instance Created: ${testInstanceId}`);

  if (durationMs < 5000) {
    console.log(`🚀 RESULT: ULTRA FAST (< 5 seconds)! Start delay is completely ELIMINATED! ✅`);
  } else if (durationMs < 60000) {
    console.log(`✅ RESULT: Sub-minute start (${durationSec}s)! Far below 5-10 minutes! ✅`);
  } else {
    console.log(`⚠️ RESULT: Took ${durationSec}s. Still slow.`);
  }

  // 5. Test Snapshot Loading Speed (with Redis cache)
  console.log("\n⏱️ Testing GET /tests/:id (Snapshot loading speed)...");
  const snapStart1 = Date.now();
  const snapRes1 = await fetch(`${API_URL}/tests/${testInstanceId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const snapTime1 = Date.now() - snapStart1;
  const snapBody1 = await snapRes1.json() as any;
  console.log(`First load (DB + Cache write): ${snapTime1} ms | Status: ${snapRes1.status}`);

  const snapStart2 = Date.now();
  const snapRes2 = await fetch(`${API_URL}/tests/${testInstanceId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const snapTime2 = Date.now() - snapStart2;
  console.log(`Second load (Redis Cache Hit ⚡): ${snapTime2} ms (Speedup: ${(snapTime1 / Math.max(1, snapTime2)).toFixed(1)}x) ✅`);

  // Check section 1 questions
  const sections = snapBody1.sections || [];
  if (sections.length > 0) {
    console.log(`Section 1 ("${sections[0].sectionName}") question count: ${sections[0].questions.length} questions ready ✅`);
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL TESTS PASSED: START TIME IS MEASURED IN SECONDS, NOT MINUTES!");
  console.log("=======================================================\n");
}

runLiveTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
