const { PrismaClient } = require("@prisma/client");

async function runE2E() {
  console.log("=== Starting End-to-End Reports API Verification ===");
  const prisma = new PrismaClient();
  const baseUrl = "http://localhost:4000/api/v1";

  try {
    // 1. Ensure template, question, and config exist in DB
    console.log("Step 1: Fetching or Seeding test config...");
    let template = await prisma.template.findFirst();
    if (!template) {
      template = await prisma.template.create({
        data: {
          conceptKey: "NodeJS",
          difficultyLevel: "MEDIUM",
          questionType: "multiple_choice",
          name: "Verify Node Template",
          structure: {},
          variableSchema: {},
          constraints: {},
          solutionSchema: {},
          config: {},
        },
      });
    }

    const testConfig = await prisma.testConfig.create({
      data: {
        configKey: "reports-config-key-" + Date.now(),
        companyName: "Reports Corp",
        displayName: "E2E Reports Test Config",
        totalDurationSeconds: 3600,
        totalQuestions: 1,
        isActive: true,
      },
    });

    // 2. Signup a new test candidate
    const email = `reports-candidate-${Date.now()}@intervu.ai`;
    const password = "Password123!";
    console.log(`Step 2: Signing up candidate ${email}...`);
    const signupRes = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        fullName: "E2E Reports Candidate",
      }),
    });

    if (!signupRes.ok) {
      const signupErr = await signupRes.text();
      throw new Error(`Signup failed: ${signupRes.status} - ${signupErr}`);
    }

    // Look up user from database by email to get clean userId
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new Error(`User not found in DB after signup!`);
    }
    const userId = user.id;
    console.log("User signed up successfully. User ID:", userId);

    // 3. Login to obtain access token
    console.log("Step 3: Logging in...");
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status}`);
    }
    const loginEnvelope = await loginRes.json();
    const token = loginEnvelope.data.accessToken;

    // 4. Create an evaluated attempt via Prisma to test reports immediately
    console.log(
      "Step 4: Seeding completed TestInstance and EvaluationResult in DB...",
    );
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

    const evaluation = await prisma.evaluationResult.create({
      data: {
        testInstance: { connect: { id: attempt.id } },
        user: { connect: { id: userId } },
        overallScore: 85,
        confidenceScore: 9.0,
        correctAnswers: 8,
        incorrectAnswers: 2,
        totalQuestions: 10,
        evaluatedAt: new Date(),
        skillScores: {
          create: [
            { skill: "Backend", score: 85, feedback: "Solid basics" },
            {
              skill: "Databases",
              score: 55,
              feedback: "Needs SQL query practice",
            },
          ],
        },
        recommendations: {
          create: [
            {
              skill: "Databases",
              priority: "HIGH",
              title: "Optimize SQL Queries",
              description: "Practice joins and indexing strategies.",
            },
          ],
        },
      },
    });

    // 5. Test GET /reports/candidate/:attemptId
    console.log("Step 5: Testing GET /reports/candidate/:attemptId...");
    const startTime = Date.now();
    const reportRes = await fetch(
      `${baseUrl}/reports/candidate/${attempt.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!reportRes.ok) {
      const errText = await reportRes.text();
      throw new Error(`Report API failed: ${reportRes.status} - ${errText}`);
    }

    const reportEnvelope = await reportRes.json();
    const reportData = reportEnvelope.data || reportEnvelope;
    const reportLatency = Date.now() - startTime;
    console.log(`Candidate Report received. Latency: ${reportLatency}ms`);
    console.log("Report Score:", reportData.score);
    console.log("Report Percentile:", reportData.percentile);
    console.log("Report Strengths (Score >= 70):", reportData.strengths);
    console.log("Report Weaknesses (Score < 60):", reportData.weaknesses);
    console.log("Report Improvement Plan:", reportData.improvementPlan);

    if (reportLatency > 700) {
      console.warn("⚠️ WARNING: Report latency exceeds 700ms target!");
    }

    // 6. Test GET /reports/progress
    console.log("Step 6: Testing GET /reports/progress...");
    const progressStartTime = Date.now();
    const progressRes = await fetch(`${baseUrl}/reports/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!progressRes.ok) {
      throw new Error(`Progress API failed: ${progressRes.status}`);
    }

    const progressEnvelope = await progressRes.json();
    const progressData = progressEnvelope.data || progressEnvelope;
    const progressLatency = Date.now() - progressStartTime;
    console.log(`Progress Analytics received. Latency: ${progressLatency}ms`);
    console.log("Progress Assessment Count:", progressData.assessmentCount);
    console.log("Progress Average Score:", progressData.averageScore);

    if (progressLatency > 500) {
      console.warn("⚠️ WARNING: Progress latency exceeds 500ms target!");
    }

    // 7. Test GET /reports/export/pdf/:attemptId
    console.log("Step 7: Testing GET /reports/export/pdf/:attemptId...");
    const pdfStartTime = Date.now();
    const pdfRes = await fetch(`${baseUrl}/reports/export/pdf/${attempt.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!pdfRes.ok) {
      throw new Error(`PDF Export failed: ${pdfRes.status}`);
    }

    const pdfBuffer = await pdfRes.arrayBuffer();
    const pdfLatency = Date.now() - pdfStartTime;
    console.log(
      `PDF Export received. Latency: ${pdfLatency}ms. Content size: ${pdfBuffer.byteLength} bytes.`,
    );
    console.log("PDF Content-Type Header:", pdfRes.headers.get("Content-Type"));
    console.log(
      "PDF Content-Disposition Header:",
      pdfRes.headers.get("Content-Disposition"),
    );

    if (pdfLatency > 5000) {
      console.warn("⚠️ WARNING: PDF Export latency exceeds 5s target!");
    }

    // 8. Test GET /reports/export/json/:attemptId
    console.log("Step 8: Testing GET /reports/export/json/:attemptId...");
    const jsonStartTime = Date.now();
    const jsonRes = await fetch(
      `${baseUrl}/reports/export/json/${attempt.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!jsonRes.ok) {
      throw new Error(`JSON Export failed: ${jsonRes.status}`);
    }

    const jsonExportEnvelope = await jsonRes.json();
    const jsonExport = jsonExportEnvelope.data || jsonExportEnvelope;
    const jsonLatency = Date.now() - jsonStartTime;
    console.log(`JSON Export received. Latency: ${jsonLatency}ms.`);
    console.log("JSON Export Metadata version:", jsonExport.metadata.version);
    console.log("JSON Export Summary score:", jsonExport.summary.overallScore);

    if (jsonLatency > 1000) {
      console.warn("⚠️ WARNING: JSON Export latency exceeds 1s target!");
    }

    // 9. Verify Audit Trail events are registered
    console.log("Step 9: Verifying registered Audit Logs...");
    const auditLogs = await prisma.assessmentAuditLog.findMany({
      where: { attemptId: attempt.id },
      orderBy: { createdAt: "asc" },
    });

    console.log("Captured events:");
    auditLogs.forEach((log) => {
      console.log(`- [${log.createdAt.toISOString()}] [${log.eventType}]`);
    });

    console.log("\n=== E2E Reports Verification COMPLETED successfully! ===");
  } catch (error) {
    console.error("❌ E2E REPORTS VERIFICATION ERROR:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runE2E();
