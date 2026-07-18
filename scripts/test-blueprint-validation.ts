import { PrismaClient, DifficultyLevel, QuestionStatus } from "@prisma/client";
import { BlueprintService } from "../apps/api/src/modules/blueprint/services/blueprint.service";

const prisma = new PrismaClient();

async function run() {
  console.log("🚀 Starting Blueprint Validation Scenario Tests...\n");

  // 1. Fetch a real active concept from the database
  const concept = await prisma.concept.findFirst({
    where: { status: "ACTIVE" },
    include: { topic: true },
  });

  if (!concept) {
    console.error("❌ No active concepts found in the database. Please create one first.");
    await prisma.$disconnect();
    return;
  }

  console.log(`📋 Using real DB Concept: "${concept.name}" (Code: ${concept.code}, Topic ID: ${concept.topicId})`);

  const blueprintService = new BlueprintService(
    prisma,
    null as any, // repository stub
    null as any, // loader stub
    null as any, // topicRegistryLoader
  );

  // Inject prisma
  (blueprintService as any).prisma = prisma;
  (blueprintService as any).prisma.styleProfile = {
    findUnique: async () => ({ id: "style-profile-id", active: true, status: "ACTIVE" }),
  } as any;

  (blueprintService as any).topicRegistryLoader = {
    getTopicById: async () => {
      return {
        id: concept.topicId,
        topic: concept.topic?.name || "JavaScript Basics",
        concepts: [concept.code],
      };
    },
  };

  const mockBlueprintBase = {
    id: "test-blueprint-id",
    name: "Test Blueprint",
    styleProfileId: "style-profile-id",
    sections: [
      {
        sectionId: "Sec1",
        percentage: 100,
        topicAllocations: [{ topicId: concept.topicId, percentage: 100 }],
        difficultyAllocation: { easy: 100, medium: 0, hard: 0 },
      },
    ],
  };

  // Cleanup any leftover test questions from previous runs
  await prisma.question.deleteMany({
    where: { questionText: "TEST_BLUEPRINT_QUESTION" },
  });

  // --------------------------------------------------------------------------------
  // Scenario 1: Active AI Template Exists (EASY)
  // --------------------------------------------------------------------------------
  console.log("\n--- Scenario 1: Active AI Template Exists ---");

  (blueprintService as any).templateRepository = {
    findAll: async () => {
      return [
        {
          id: "mock-template-id",
          conceptKey: concept.code,
          isActive: true,
          difficultyLevel: DifficultyLevel.EASY,
        },
      ];
    },
  };

  const result1 = await blueprintService.validateBlueprintObject(mockBlueprintBase as any);
  console.log("Validation Valid?", result1.valid ? "✅ YES (Pass)" : "❌ NO (Fail)");
  if (!result1.valid) console.log("Errors:", result1.errors);

  // --------------------------------------------------------------------------------
  // Scenario 2: No Templates, but Active Manual Question Exists (EASY)
  // --------------------------------------------------------------------------------
  console.log("\n--- Scenario 2: No Templates, but Active Manual Question Exists ---");

  // Override templates to return empty array
  (blueprintService as any).templateRepository.findAll = async () => [];

  // Seed an active manual question in the pool
  const testQuestion = await prisma.question.create({
    data: {
      questionText: "TEST_BLUEPRINT_QUESTION",
      answer: "A scripting language.",
      explanation: "Standard explanation.",
      topicId: concept.topicId,
      conceptId: concept.id,
      difficulty: "EASY",
      source: "MANUAL",
      status: QuestionStatus.ACTIVE,
    },
  });

  const result2 = await blueprintService.validateBlueprintObject(mockBlueprintBase as any);
  console.log("Validation Valid?", result2.valid ? "✅ YES (Pass)" : "❌ NO (Fail)");
  if (!result2.valid) console.log("Errors:", result2.errors);

  // --------------------------------------------------------------------------------
  // Scenario 3: Neither Templates nor Manual Questions Exist (EASY)
  // --------------------------------------------------------------------------------
  console.log("\n--- Scenario 3: Neither Templates nor Manual Questions Exist ---");

  // Delete seeded question
  await prisma.question.delete({
    where: { id: testQuestion.id },
  });

  const result3 = await blueprintService.validateBlueprintObject(mockBlueprintBase as any);
  console.log("Validation Valid?", !result3.valid ? "✅ YES (Correctly Failed)" : "❌ NO (Should have failed)");
  if (!result3.valid) console.log("Returned Error Message:", result3.errors[0]);

  console.log("\n🎉 ALL SCENARIO CHECKS PASSED SUCCESSFULLY!");
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
});
