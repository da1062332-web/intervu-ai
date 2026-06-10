import {
  connectPrisma,
  disconnectPrisma,
  prisma,
  AssemblyRepository,
} from "../packages/database/src";
import { ValidationOrchestratorService } from "../packages/ai-core/src/validation/validation-orchestrator.service";
import { GeneratedQuestionDto } from "@intervu-ai/contracts";
import jwt from "jsonwebtoken";
import { createId } from "@paralleldrive/cuid2";

const API_URL = process.env.API_URL || "http://127.0.0.1:4000/api/v1";
const JWT_SECRET =
  process.env.JWT_SECRET || "replace-with-a-long-secret-at-least-32-chars";

async function run() {
  console.log("==========================================");
  console.log("Starting Assessment Lifecycle Verification");
  console.log("==========================================\n");

  await connectPrisma();

  let dummyUserId: string | null = null;
  let testConfigId: string | null = null;
  let templateId: string | null = null;
  let sessionId: string | null = null;
  let generatedQuestionIds: string[] = [];

  try {
    // 1. Verify API is running
    try {
      const healthCheck = await fetch(`${API_URL}/health`);
      if (healthCheck.status !== 200 && healthCheck.status !== 400) {
        throw new Error("Health check returned bad status");
      }
    } catch (e) {
      console.error(`❌ API is not running at ${API_URL}.`);
      console.error(
        "Please start the backend (npm run dev in apps/api) before running this script."
      );
      process.exit(1);
    }

    const validationOrchestrator = new ValidationOrchestratorService();

    // 2. Create Candidate User
    console.log("Creating candidate user...");
    const user = await prisma.user.create({
      data: {
        email: `candidate_lifecycle_${Date.now()}@example.com`,
        passwordHash: "dummyhash",
        fullName: "Lifecycle Candidate",
        role: "CANDIDATE",
      },
    });
    dummyUserId = user.id;

    // Create a database Session for JWT Strategy validation
    console.log("Creating session in database...");
    const session = await prisma.session.create({
      data: {
        userId: dummyUserId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
      },
    });
    sessionId = session.id;

    // 3. Create Template
    const template = await prisma.template.create({
      data: {
        templateKey: `lifecycle_tpl_${Date.now()}`,
        conceptKey: "percentages",
        difficultyLevel: "MEDIUM",
        questionType: "mcq",
      },
    });
    templateId = template.id;

    // 4. Create Generated Questions, validate them, and add to pool
    const mockQuestions: GeneratedQuestionDto[] = [
      {
        questionId: createId(),
        templateId: templateId,
        conceptKey: "percentages",
        difficultyLevel: "medium",
        questionType: "mcq",
        questionText: "If the price of petrol is increased by 25%, by how much percent must a motorist reduce the consumption of petrol?",
        options: ["15", "20", "22", "30"],
        correctAnswer: "20",
        solution: JSON.stringify({
          steps: ["New price is 125.", "Reduction = (25 / 125) * 100 = 20%."],
          finalAnswer: "20",
        }),
        metadata: { percent_increase: 25, steps: 2 },
      },
      {
        questionId: createId(),
        templateId: templateId,
        conceptKey: "percentages",
        difficultyLevel: "medium",
        questionType: "mcq",
        questionText: "A shopkeeper sells a book for $240 gaining 20% on the cost price. Find the cost price of the book.",
        options: ["180", "200", "220", "230"],
        correctAnswer: "200",
        solution: JSON.stringify({
          steps: ["Selling Price = 120% of Cost Price", "Cost Price = 240 / 1.2 = 200."],
          finalAnswer: "200",
        }),
        metadata: { steps: 2 },
      }
    ];

    console.log("Validating generated questions...");
    for (const q of mockQuestions) {
      const report = validationOrchestrator.validateQuestion(q);
      if (!report.passed) {
        throw new Error(`AI Validation failed: ${JSON.stringify(report.errors)}`);
      }
      
      // Store in DB pool
      const createdQ = await prisma.generatedQuestion.create({
        data: {
          id: q.questionId,
          templateId: q.templateId,
          questionHash: `lifecycle_hash_${q.questionId}`,
          conceptKey: q.conceptKey,
          difficultyLevel: q.difficultyLevel.toUpperCase() as "EASY" | "MEDIUM" | "HARD",
          questionType: q.questionType,
          questionText: q.questionText,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          solution: q.solution,
          metadata: q.metadata as any,
        }
      });
      generatedQuestionIds.push(createdQ.id);
    }

    // 5. Setup Test Config & Sections matching the pool questions concept
    console.log("Creating test configuration...");
    const config = await prisma.testConfig.create({
      data: {
        configKey: `lifecycle_config_${Date.now()}`,
        companyName: "Lifecycle Verification Inc",
        displayName: "E2E Assessment Lifecycle Test",
        totalDurationSeconds: 1200,
        totalQuestions: 2,
      },
    });
    testConfigId = config.id;

    await prisma.testSection.create({
      data: {
        testConfigId: config.id,
        sectionKey: "percentages",
        displayName: "Quantitative Aptitude",
        durationSeconds: 1200,
        questionCount: 2,
        orderIndex: 0,
      },
    });

    // 6. Sign Jwt with access type and sessionId
    const token = jwt.sign(
      {
        sub: dummyUserId,
        email: user.email,
        role: user.role,
        type: "access",
        sessionId: sessionId,
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
        jwtid: createId(),
      }
    );

    // 7. Call API POST /tests/start
    console.log(`Hitting POST /tests/start for config: ${config.id}...`);
    const response = await fetch(`${API_URL}/tests/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        testConfigId: config.id,
      }),
    });

    const result = await response.json();
    console.log("API Response Status:", response.status);
    
    if (response.status !== 200 || !result.success) {
      throw new Error(`API returned error: ${JSON.stringify(result.error)}`);
    }

    const testInstanceId = result.data.testInstanceId;
    console.log(`API generated test instance: ${testInstanceId}`);

    // 8. Verify DB Persistence & Assembly completeness
    const assemblyRepo = new AssemblyRepository();
    const assemblyData = await assemblyRepo.getAssemblyData(testInstanceId);
    
    if (!assemblyData) {
      throw new Error("Assembled test instance not found in database via assembly read model.");
    }

    if (assemblyData.userId !== dummyUserId) {
      throw new Error(`User ID mismatch. Expected ${dummyUserId}, got ${assemblyData.userId}`);
    }

    if (assemblyData.sections.length !== 1) {
      throw new Error(`Expected 1 section, got ${assemblyData.sections.length}`);
    }

    const assembledSection = assemblyData.sections[0];
    if (assembledSection.questions.length !== 2) {
      throw new Error(`Expected 2 questions assembled, got ${assembledSection.questions.length}`);
    }

    console.log("✅ API start response matches envelope contract.");
    console.log("✅ DB Transaction & Pool Integration validated successfully.");
    console.log("✅ End-to-end question flow (Gen -> Validate -> Pool -> Start -> Assemble -> Persist) fully verified.");

    console.log("\n==========================================");
    console.log("ASSESSMENT PASS");
    console.log("==========================================\n");
    process.exit(0);
  } catch (err: any) {
    console.error("\n==========================================");
    console.error("ASSESSMENT FAIL");
    console.error(err.message || err);
    console.error("==========================================\n");
    process.exit(1);
  } finally {
    console.log("--> Cleaning up dummy data...");
    if (dummyUserId) {
      await prisma.testInstance.deleteMany({ where: { userId: dummyUserId } }).catch(() => {});
      if (sessionId) {
        await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
      }
      await prisma.user.delete({ where: { id: dummyUserId } }).catch(() => {});
    }
    if (testConfigId) {
      await prisma.testSection.deleteMany({ where: { testConfigId } }).catch(() => {});
      await prisma.testConfig.delete({ where: { id: testConfigId } }).catch(() => {});
    }
    for (const id of generatedQuestionIds) {
      await prisma.generatedQuestion.delete({ where: { id } }).catch(() => {});
    }
    if (templateId) {
      await prisma.template.delete({ where: { id: templateId } }).catch(() => {});
    }
    await disconnectPrisma();
  }
}

run();
