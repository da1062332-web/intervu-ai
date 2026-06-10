import {
  connectPrisma,
  disconnectPrisma,
  TestConfigRepository,
  prisma
} from "../packages/database/src";
import jwt from "jsonwebtoken";

const API_URL = process.env.API_URL || "http://127.0.0.1:4000/api/v1";
const JWT_SECRET = process.env.JWT_SECRET || "replace-with-a-long-secret-at-least-32-chars";

async function runVerification() {
  console.log("==========================================");
  console.log("Starting POST /tests/start Verification");
  console.log("==========================================\n");

  await connectPrisma();
  let testConfigId: string | null = null;
  let dummyUserId: string | null = null;

  try {
    // 1. Check if backend is running
    try {
      const healthCheck = await fetch(`${API_URL}/health`);
      if (healthCheck.status !== 200 && healthCheck.status !== 400) throw new Error("Health check failed");
    } catch (e) {
      console.error(`❌ API is not running at ${API_URL}.`);
      console.error("Please start the backend (npm run dev in apps/api) before running this script.");
      process.exit(1);
    }

    // 2. Setup Data: Dummy User
    console.log("Creating Dummy User...");
    const user = await prisma.user.create({
      data: {
        email: `candidate_verify_${Date.now()}@example.com`,
        passwordHash: "dummyhash",
        fullName: "Test Candidate",
        role: "CANDIDATE",
      }
    });
    dummyUserId = user.id;

    // 3. Setup Data: Test Config
    console.log("Creating Dummy Test Config...");
    const configRepo = new TestConfigRepository();
    const config = await configRepo.create({
      configKey: `test_verify_config_${Date.now()}`,
      companyName: "Verify Inc",
      displayName: "Integration Verification Test",
      totalDurationSeconds: 1200,
      totalQuestions: 5,
    });
    testConfigId = config.id;

    await prisma.testSection.create({
      data: {
        testConfigId: config.id,
        sectionKey: "percentages", // This concept should exist in the generator or pool
        displayName: "Math",
        durationSeconds: 1200,
        questionCount: 5,
        orderIndex: 1
      }
    });

    // Generate questions to ensure pool is not empty for this section
    const template = await prisma.template.create({
      data: {
        templateKey: `verify_template_${Date.now()}`,
        conceptKey: "percentages",
        difficultyLevel: "MEDIUM",
        questionType: "mcq",
      }
    });
    
    for (let i = 0; i < 5; i++) {
      await prisma.generatedQuestion.create({
        data: {
          templateId: template.id,
          questionHash: `verify_hash_${Date.now()}_${i}`,
          conceptKey: "percentages",
          difficultyLevel: "MEDIUM",
          questionType: "mcq",
          questionText: "What is 10% of 100?",
          options: ["5", "10", "15", "20"],
          correctAnswer: "10",
          solution: "10",
          metadata: {}
        }
      });
    }

    // 4. Generate JWT
    console.log("Generating valid JWT token...");
    const token = jwt.sign(
      { sub: dummyUserId, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 5. Hit API POST /tests/start
    console.log(`\nTesting POST /tests/start with config: ${config.id}`);
    const response = await fetch(`${API_URL}/tests/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        testConfigId: config.id
      })
    });

    const result = await response.json();

    // 6. Verify DTO and Structure
    console.log("\nAPI Response:");
    console.log(JSON.stringify(result, null, 2));

    if (response.status !== 200 || !result.success) {
      throw new Error(`API returned error: ${JSON.stringify(result.error)}`);
    }

    if (
      result.data &&
      result.data.testInstanceId &&
      result.data.status === "CREATED" &&
      result.data.durationSeconds === 1200
    ) {
      console.log("\nAPI DTO Structure: PASS");
      console.log("Test Instance Creation: PASS");
      console.log("Configuration Loading: PASS");
    } else {
      throw new Error("API DTO mismatch.");
    }

    // 7. Verify Persistence
    const testInstance = await prisma.testInstance.findUnique({
      where: { id: result.data.testInstanceId },
      include: { sections: { include: { questions: true } } }
    });

    if (testInstance && testInstance.userId === dummyUserId) {
      console.log("Persistence: PASS");
    } else {
      throw new Error("Test Instance not found in DB.");
    }

    if (testInstance.sections.length > 0 && testInstance.sections[0].questions.length === 5) {
      console.log("Pool Integration & Question Retrieval: PASS");
    } else {
      throw new Error("Questions were not properly assembled from the pool.");
    }

    console.log("\n==========================================");
    console.log("POST /tests/start Summary: PASS");
    console.log("==========================================\n");

  } catch (err: any) {
    console.error("\n==========================================");
    console.error("POST /tests/start FAILED");
    console.error(err.message);
    console.error("==========================================\n");
    process.exit(1);
  } finally {
    // Cleanup
    if (testConfigId) {
      await prisma.testConfig.delete({ where: { id: testConfigId } }).catch(() => {});
    }
    if (dummyUserId) {
      await prisma.user.delete({ where: { id: dummyUserId } }).catch(() => {});
    }
    await disconnectPrisma();
  }
}

runVerification();
