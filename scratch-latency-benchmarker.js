const { PrismaClient } = require("@prisma/client");

async function runBenchmark() {
  console.log("=== Starting Latency Benchmark ===");
  const prisma = new PrismaClient();
  const baseUrl = "http://localhost:4000/api/v1";

  try {
    // 1. Fetch or create a test config
    console.log("Step 1: Preparing test configuration...");
    let testConfig = await prisma.testConfig.findFirst({
      where: { displayName: "E2E Reports Test Config" },
    });

    if (!testConfig) {
      testConfig = await prisma.testConfig.create({
        data: {
          configKey: "benchmark-key-" + Date.now(),
          companyName: "Benchmark Corp",
          displayName: "E2E Reports Test Config",
          totalDurationSeconds: 3600,
          totalQuestions: 1,
          isActive: true,
        },
      });
    }

    // 2. Fetch or create a candidate
    console.log("Step 2: Preparing candidate account...");
    const email = `benchmark-candidate-${Date.now()}@intervu.ai`;
    const password = "Password123!";

    await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        fullName: "Benchmark Candidate",
      }),
    });

    // Resolve user ID
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Candidate signup failed");
    const userId = user.id;

    // Login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const loginEnvelope = await loginRes.json();
    const token = loginEnvelope.data.accessToken;

    // 3. Create test attempts in DB to simulate candidates
    console.log("Step 3: Seeding 5 evaluation results to simulate history...");
    const attemptIds = [];
    for (let i = 0; i < 5; i++) {
      const attempt = await prisma.testInstance.create({
        data: {
          user: { connect: { id: userId } },
          testConfig: { connect: { id: testConfig.id } },
          status: "COMPLETED",
          startedAt: new Date(Date.now() - 3600 * 1000),
          submittedAt: new Date(),
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });
      attemptIds.push(attempt.id);

      await prisma.evaluationResult.create({
        data: {
          testInstance: { connect: { id: attempt.id } },
          user: { connect: { id: userId } },
          overallScore: 70 + i * 5, // 70, 75, 80, 85, 90
          confidenceScore: 8.5,
          correctAnswers: 7 + i,
          incorrectAnswers: 3 - i,
          totalQuestions: 10,
          evaluatedAt: new Date(),
          skillScores: {
            create: [
              { skill: "Backend", score: 70 + i * 5, feedback: "Good" },
              {
                skill: "Frontend",
                score: 60 + i * 5,
                feedback: "Keep practicing",
              },
            ],
          },
        },
      });
    }

    const testAttemptId = attemptIds[attemptIds.length - 1];

    // 4. Run iterations to profile averages
    const iterations = 5;
    console.log(`\nStep 4: Running ${iterations} benchmark loops...`);

    const metrics = {
      candidateReport: [],
      progressAnalytics: [],
      pdfExport: [],
      jsonExport: [],
    };

    for (let i = 1; i <= iterations; i++) {
      console.log(`\nIteration ${i}/${iterations}:`);

      // A. Candidate Report
      let start = Date.now();
      const reportRes = await fetch(
        `${baseUrl}/reports/candidate/${testAttemptId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!reportRes.ok) throw new Error("Report API failed");
      metrics.candidateReport.push(Date.now() - start);
      console.log(
        `- Candidate Report: ${metrics.candidateReport[metrics.candidateReport.length - 1]}ms`,
      );

      // B. Progress Analytics (cached after first hit)
      start = Date.now();
      const progressRes = await fetch(`${baseUrl}/reports/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!progressRes.ok) throw new Error("Progress API failed");
      metrics.progressAnalytics.push(Date.now() - start);
      console.log(
        `- Progress Analytics: ${metrics.progressAnalytics[metrics.progressAnalytics.length - 1]}ms`,
      );

      // C. PDF Export
      start = Date.now();
      const pdfRes = await fetch(
        `${baseUrl}/reports/export/pdf/${testAttemptId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!pdfRes.ok) throw new Error("PDF Export API failed");
      await pdfRes.arrayBuffer();
      metrics.pdfExport.push(Date.now() - start);
      console.log(
        `- PDF Export: ${metrics.pdfExport[metrics.pdfExport.length - 1]}ms`,
      );

      // D. JSON Export
      start = Date.now();
      const jsonRes = await fetch(
        `${baseUrl}/reports/export/json/${testAttemptId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!jsonRes.ok) throw new Error("JSON Export API failed");
      await jsonRes.json();
      metrics.jsonExport.push(Date.now() - start);
      console.log(
        `- JSON Export: ${metrics.jsonExport[metrics.jsonExport.length - 1]}ms`,
      );
    }

    // 5. Output Summary statistics
    const avg = (arr) =>
      Math.round(arr.reduce((sum, v) => sum + v, 0) / arr.length);

    console.log("\n=== LATENCY BENCHMARK RESULTS ===");
    console.log(
      `Candidate Report API (Average): ${avg(metrics.candidateReport)}ms`,
    );
    console.log(
      `Progress Analytics API (Average): ${avg(metrics.progressAnalytics)}ms (First hit: ${metrics.progressAnalytics[0]}ms, Cached: ${avg(metrics.progressAnalytics.slice(1))}ms)`,
    );
    console.log(`PDF Export API (Average): ${avg(metrics.pdfExport)}ms`);
    console.log(`JSON Export API (Average): ${avg(metrics.jsonExport)}ms`);
  } catch (error) {
    console.error("❌ BENCHMARK ERROR:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runBenchmark();
