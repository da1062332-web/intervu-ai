import {
  connectPrisma,
  disconnectPrisma,
  prisma,
  AssemblyRepository,
} from "../packages/database/src";
import { ValidationOrchestratorService } from "../packages/ai-core/src/validation/validation-orchestrator.service";
import { GeneratedQuestionDto } from "@intervu-ai/contracts";
import { createId } from "@paralleldrive/cuid2";

async function run() {
  console.log("==========================================");
  console.log("Starting Assembly Engine Verification");
  console.log("==========================================\n");

  await connectPrisma();

  let dummyUserId: string | null = null;
  let testConfigId: string | null = null;
  let templateId: string | null = null;
  let generatedQuestionIds: string[] = [];

  try {
    const assemblyRepo = new AssemblyRepository();
    const validationOrchestrator = new ValidationOrchestratorService();

    // 1. Create Dummy User
    const user = await prisma.user.create({
      data: {
        email: `verify_assembly_user_${Date.now()}@example.com`,
        passwordHash: "dummyhash",
        fullName: "Assembly Candidate",
        role: "CANDIDATE",
      },
    });
    dummyUserId = user.id;

    // 2. Create Dummy Template
    const template = await prisma.template.create({
      data: {
        templateKey: `verify_assembly_tpl_${Date.now()}`,
        conceptKey: "percentages",
        difficultyLevel: "EASY",
        questionType: "mcq",
      },
    });
    templateId = template.id;

    // 3. Create Dummy Questions in Pool
    const mockQuestions: GeneratedQuestionDto[] = [
      {
        questionId: createId(),
        templateId: templateId,
        conceptKey: "percentages",
        difficultyLevel: "easy",
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
        difficultyLevel: "easy",
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

    // Validate the questions first using Validation Engine (Dev 1)
    console.log("--> Running AI Validation Engine checks on questions...");
    for (const q of mockQuestions) {
      const report = validationOrchestrator.validateQuestion(q);
      if (!report.passed) {
        throw new Error(`AI Validation failed for question ${q.questionId}: ${JSON.stringify(report.errors)}`);
      }
      console.log(`✅ Question ${q.questionId} validated successfully. Score: ${report.score}`);
    }

    // Persist mock questions to the database generatedQuestion pool
    for (const q of mockQuestions) {
      const createdQ = await prisma.generatedQuestion.create({
        data: {
          id: q.questionId,
          templateId: q.templateId,
          questionHash: `verify_hash_${q.questionId}`,
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

    // 4. Create Dummy TestConfig and Section
    const config = await prisma.testConfig.create({
      data: {
        configKey: `verify_assembly_cfg_${Date.now()}`,
        companyName: "Assembly Verification Inc",
        displayName: "Assembly Integration Test",
        totalDurationSeconds: 1200,
        totalQuestions: 2,
      },
    });
    testConfigId = config.id;

    const section = await prisma.testSection.create({
      data: {
        testConfigId: config.id,
        sectionKey: "percentages",
        displayName: "Percentages Section",
        durationSeconds: 1200,
        questionCount: 2,
        orderIndex: 1,
      },
    });

    // 5. Build assembly data structure for persisting
    const testInstanceId = createId();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + 1200);

    const instanceData = {
      id: testInstanceId,
      userId: dummyUserId,
      testConfigId: config.id,
      status: "CREATED" as const,
      expiresAt,
    };

    const sectionsData = [
      {
        id: createId(),
        sectionKey: section.sectionKey,
        sectionName: section.displayName,
        durationSeconds: section.durationSeconds,
        questionCount: section.questionCount,
        orderIndex: section.orderIndex,
      },
    ];

    const questionsDataMap = {
      [section.sectionKey]: mockQuestions.map((q, idx) => ({
        id: createId(),
        questionId: q.questionId,
        questionOrder: idx,
        questionSnapshot: q as any,
      })),
    };

    // 6. Execute Persistence Transaction (Dev 2)
    console.log("--> Persisting assembled test instance in database transaction...");
    const persistedInstance = await assemblyRepo.persistAssembly(
      instanceData,
      sectionsData,
      questionsDataMap
    );

    // 7. Verify the Assembly Read Model
    console.log("--> Querying and verifying full assembly data...");
    const assemblyData = await assemblyRepo.getAssemblyData(persistedInstance.id);
    if (!assemblyData) {
      throw new Error("Persisted assembly not found in DB.");
    }

    console.log(`Test Instance ID: ${assemblyData.id}`);
    console.log(`Sections count: ${assemblyData.sections.length}`);
    
    // Asserts
    if (assemblyData.sections.length !== 1) {
      throw new Error(`Expected exactly 1 section, got ${assemblyData.sections.length}`);
    }

    const assembledSection = assemblyData.sections[0];
    console.log(`Questions in section: ${assembledSection.questions.length}`);

    if (assembledSection.questions.length !== 2) {
      throw new Error(`Expected exactly 2 questions, got ${assembledSection.questions.length}`);
    }

    // Assert no duplicate questions in the assembled instance
    const questionIds = assembledSection.questions.map((q) => q.questionId);
    const uniqueQuestionIds = new Set(questionIds);
    if (questionIds.length !== uniqueQuestionIds.size) {
      throw new Error("Duplicate questions found in the assembled test section!");
    }

    console.log("✅ Duplication prevention verified: No duplicate questions persisted.");
    console.log("✅ Section structure verified successfully.");

    console.log("\n==========================================");
    console.log("ASSEMBLY PASS");
    console.log("==========================================\n");
    process.exit(0);
  } catch (err: any) {
    console.error("\n==========================================");
    console.error("ASSEMBLY FAIL");
    console.error(err.message || err);
    console.error("==========================================\n");
    process.exit(1);
  } finally {
    // Cleanup
    console.log("--> Cleaning up dummy data...");
    if (dummyUserId) {
      await prisma.testInstance.deleteMany({ where: { userId: dummyUserId } }).catch(() => {});
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
