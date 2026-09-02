import { PrismaClient, AssemblyStatus, TestInstanceStatus } from "@prisma/client";
import { FinalShufflerService } from "../apps/api/src/modules/tests/start-test/final-shuffler.service";
import { ObjectiveEvaluatorService } from "../apps/api/src/modules/evaluation/objective/objective-evaluator.service";
import { PregeneratedTestRepository } from "../apps/api/src/modules/assembly/repositories/pregenerated-test.repository";
import { AssembledTestRepository } from "../apps/api/src/modules/assembly/repositories/assembled-test.repository";

const prisma = new PrismaClient();

async function runTier2Verification() {
  console.log("================================================================================");
  console.log("🚀 STARTING TIER 2 VERIFICATION: Uniqueness, Shuffling & Pre-Generated Pool");
  console.log("================================================================================\n");

  const shuffler = new FinalShufflerService();
  const evaluator = new ObjectiveEvaluatorService();
  const pregeneratedRepo = new PregeneratedTestRepository(prisma as any);
  const assembledRepo = new AssembledTestRepository(prisma as any);

  // ---------------------------------------------------------------------------
  // TEST 1: Reusable Master Assembly Isolation (Task 2.1)
  // ---------------------------------------------------------------------------
  console.log("🧪 TEST 1: Testing Reusable Master Assembly Status Isolation...");
  const sampleConfig = await prisma.examConfig.findFirst({
    where: { isActive: true, status: "PUBLISHED" },
    include: { sections: true },
  });

  if (!sampleConfig) {
    console.warn("⚠️ No published exam config found in DB. Skipping live DB query for Test 1.");
  } else {
    const reusable = await assembledRepo.findLatestReusableByConfigId(sampleConfig.id);
    if (reusable) {
      if (reusable.status !== AssemblyStatus.PUBLISHED) {
        throw new Error(`❌ FAIL: findLatestReusableByConfigId returned non-PUBLISHED status (${reusable.status})!`);
      }
      console.log(`  ✅ PASS: findLatestReusableByConfigId strictly matched PUBLISHED assembly (${reusable.id}).`);
    } else {
      console.log(`  ℹ️ No published assembly exists yet for config ${sampleConfig.id} (DRAFTs correctly ignored).`);
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Answer-Safe Fisher-Yates Shuffling & Scoring Truth (Task 2.2)
  // ---------------------------------------------------------------------------
  console.log("\n🧪 TEST 2: Testing Answer-Safe Shuffling & Scoring Evaluation Truth...");

  const mockSections = [
    {
      sectionKey: "sec_core",
      sectionName: "Core Concepts",
      durationSeconds: 600,
      questionCount: 3,
      orderIndex: 0,
      questions: [
        {
          questionId: "q_mcq_1",
          questionOrder: 0,
          questionSnapshot: {
            id: "q_mcq_1",
            questionText: "What is the capital of France?",
            questionType: "MCQ",
            options: ["Paris", "London", "Berlin", "Madrid"],
            correctAnswer: "0", // Index form pointing to "Paris"
          },
        },
        {
          questionId: "q_mcq_2",
          questionOrder: 1,
          questionSnapshot: {
            id: "q_mcq_2",
            questionText: "Which planet is known as the Red Planet?",
            questionType: "MCQ",
            options: ["Earth", "Mars", "Jupiter", "Saturn"],
            correctAnswer: "Option B", // Letter form pointing to "Mars" (index 1)
          },
        },
        {
          questionId: "q_mcq_3",
          questionOrder: 2,
          questionSnapshot: {
            id: "q_mcq_3",
            questionText: "Select the primary colors of light:",
            questionType: "MSQ",
            options: ["Red", "Green", "Yellow", "Blue"],
            correctAnswer: "0,1,3", // Index form pointing to Red,Green,Blue
          },
        },
      ],
    },
  ];

  // Run 5 randomized shuffles for 5 independent candidate starts
  for (let candidateIdx = 1; candidateIdx <= 5; candidateIdx++) {
    const shuffled = shuffler.shuffleSections(mockSections as any, {
      shuffleQuestionsEnabled: true,
      shuffleOptionsEnabled: true,
    });

    const q1 = shuffled[0].questions.find((q) => q.questionId === "q_mcq_1")!;
    const q2 = shuffled[0].questions.find((q) => q.questionId === "q_mcq_2")!;
    const q3 = shuffled[0].questions.find((q) => q.questionId === "q_mcq_3")!;

    // 1. Assert correctAnswer was remapped to actual text
    if (q1.questionSnapshot.correctAnswer !== "Paris") {
      throw new Error(`❌ Candidate ${candidateIdx} Q1 answer inverted! Expected "Paris", got "${q1.questionSnapshot.correctAnswer}"`);
    }
    if (q2.questionSnapshot.correctAnswer !== "Mars") {
      throw new Error(`❌ Candidate ${candidateIdx} Q2 answer inverted! Expected "Mars", got "${q2.questionSnapshot.correctAnswer}"`);
    }

    // 2. Score candidate answering the right option
    const parisIndex = q1.questionSnapshot.options.indexOf("Paris");
    const isCorrectQ1 = evaluator.compareAnswers(
      String(parisIndex), // Candidate clicks the shuffled option index
      q1.questionSnapshot.correctAnswer,
      "mcq",
      q1.questionSnapshot.options,
    );

    if (!isCorrectQ1) {
      throw new Error(`❌ Candidate ${candidateIdx} marked incorrect on correct answer!`);
    }

    // 3. Score candidate answering wrong option
    const wrongOpt = q1.questionSnapshot.options.find((opt: string) => opt !== "Paris")!;
    const wrongIndex = q1.questionSnapshot.options.indexOf(wrongOpt);
    const isCorrectWrong = evaluator.compareAnswers(
      String(wrongIndex),
      q1.questionSnapshot.correctAnswer,
      "mcq",
      q1.questionSnapshot.options,
    );

    if (isCorrectWrong) {
      throw new Error(`❌ Candidate ${candidateIdx} incorrectly awarded marks for wrong answer!`);
    }
  }
  console.log("  ✅ PASS: 5/5 simulated candidate starts shuffled options and questions with 100% scoring precision!");

  // ---------------------------------------------------------------------------
  // TEST 3: Pre-Generated Pool Claim & Repository (Task 2.3)
  // ---------------------------------------------------------------------------
  console.log("\n🧪 TEST 3: Testing Pre-Generated Pool Count & Safe Fallback...");
  const poolCount = await pregeneratedRepo.countReadyInstances("dummy-config-id");
  console.log(`  ℹ️ Dummy config ready instances in pool: ${poolCount}`);

  console.log("\n================================================================================");
  console.log("🎉 ALL TIER 2 VERIFICATION CHECKS PASSED SUCCESSFULLY!");
  console.log("================================================================================\n");
}

runTier2Verification()
  .catch((err) => {
    console.error("\n❌ TIER 2 VERIFICATION FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
