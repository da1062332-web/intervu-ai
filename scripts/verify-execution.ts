import {
  connectPrisma,
  disconnectPrisma,
  prisma,
  AssemblyRepository,
} from "../packages/database/src";
import { GeneratedQuestionDto } from "@intervu-ai/contracts";
import { createId } from "@paralleldrive/cuid2";

async function run() {
  console.log("==========================================");
  console.log("Starting Execution UI Readiness Verification");
  console.log("==========================================\n");

  await connectPrisma();

  let dummyUserId: string | null = null;
  let testConfigId: string | null = null;
  let templateId: string | null = null;
  let generatedQuestionIds: string[] = [];
  let testInstanceId: string | null = null;

  try {
    const assemblyRepo = new AssemblyRepository();

    // 1. Create Dummy User
    const user = await prisma.user.create({
      data: {
        email: `verify_exec_user_${Date.now()}@example.com`,
        passwordHash: "dummyhash",
        fullName: "Execution Candidate",
        role: "CANDIDATE",
      },
    });
    dummyUserId = user.id;

    // 2. Create Dummy Template
    const template = await prisma.template.create({
      data: {
        templateKey: `verify_exec_tpl_${Date.now()}`,
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
        questionText:
          "If the price of petrol is increased by 25%, by how much percent must a motorist reduce the consumption of petrol?",
        options: ["15", "20", "22", "30"],
        correctAnswer: "20",
        solution: "20%",
        metadata: { steps: 2 },
      },
      {
        questionId: createId(),
        templateId: templateId,
        conceptKey: "percentages",
        difficultyLevel: "easy",
        questionType: "mcq",
        questionText:
          "A shopkeeper sells a book for $240 gaining 20% on the cost price. Find the cost price of the book.",
        options: ["180", "200", "220", "230"],
        correctAnswer: "200",
        solution: "200",
        metadata: { steps: 2 },
      },
    ];

    for (const q of mockQuestions) {
      const createdQ = await prisma.generatedQuestion.create({
        data: {
          id: q.questionId,
          templateId: q.templateId,
          questionHash: `verify_exec_hash_${q.questionId}`,
          conceptKey: q.conceptKey,
          difficultyLevel: q.difficultyLevel.toUpperCase() as
            | "EASY"
            | "MEDIUM"
            | "HARD",
          questionType: q.questionType,
          questionText: q.questionText,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          solution: q.solution,
          metadata: q.metadata as any,
        },
      });
      generatedQuestionIds.push(createdQ.id);
    }

    // 4. Create Dummy TestConfig and Section
    const config = await prisma.testConfig.create({
      data: {
        configKey: `verify_exec_cfg_${Date.now()}`,
        companyName: "Execution Verification Inc",
        displayName: "Execution Integration Test",
        totalDurationSeconds: 1800,
        totalQuestions: 2,
      },
    });
    testConfigId = config.id;

    const section = await prisma.testSection.create({
      data: {
        testConfigId: config.id,
        sectionKey: "percentages",
        displayName: "Math Section",
        durationSeconds: 1800,
        questionCount: 2,
        orderIndex: 0,
      },
    });

    testInstanceId = createId();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + 1800);

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

    // Persist assembly
    const persistedInstance = await assemblyRepo.persistAssembly(
      instanceData,
      sectionsData,
      questionsDataMap,
    );

    // 5. Query Assembly and Map to UI Contract Model
    console.log("--> Fetching stored instance for UI mapping assertion...");
    const assemblyData = await assemblyRepo.getAssemblyData(
      persistedInstance.id,
    );
    if (!assemblyData) {
      throw new Error("Failed to retrieve assembly details from database.");
    }

    // Map UI structure
    const uiTestInstance = {
      id: assemblyData.id,
      testConfigId: assemblyData.testConfigId,
      userId: assemblyData.userId,
      assessmentName: config.displayName,
      candidateName: user.fullName || "Candidate",
      status: assemblyData.status,
      durationSeconds: config.totalDurationSeconds,
      sections: assemblyData.sections.map((s) => ({
        id: s.id,
        sectionKey: s.sectionKey,
        title: s.sectionName,
        questions: s.questions.map((q) => {
          const snapshot =
            q.questionSnapshot as unknown as GeneratedQuestionDto;
          return {
            id: q.questionId,
            questionHash: snapshot.questionHash || `hash-${q.id}`,
            text: snapshot.questionText,
            options: (snapshot.options || []).map((o, idx) => ({
              id: `opt-${idx}`,
              text: o,
            })),
            orderIndex: q.questionOrder,
          };
        }),
      })),
    };

    // Assertions for UI State compatibility
    console.log(
      "--> Running schema and structural validations for Execution UI...",
    );
    if (!uiTestInstance.id || typeof uiTestInstance.id !== "string") {
      throw new Error("Validation Failed: Invalid or missing TestInstance ID");
    }
    if (
      uiTestInstance.status !== "CREATED" &&
      uiTestInstance.status !== "IN_PROGRESS"
    ) {
      throw new Error(
        `Validation Failed: Invalid status ${uiTestInstance.status}`,
      );
    }
    if (uiTestInstance.durationSeconds !== 1800) {
      throw new Error(
        `Validation Failed: Mismatched duration, expected 1800, got ${uiTestInstance.durationSeconds}`,
      );
    }
    if (uiTestInstance.sections.length === 0) {
      throw new Error("Validation Failed: Sections list is empty");
    }

    const firstSection = uiTestInstance.sections[0];
    if (firstSection.title !== "Math Section") {
      throw new Error(
        `Validation Failed: Expected section title 'Math Section', got '${firstSection.title}'`,
      );
    }
    if (firstSection.questions.length !== 2) {
      throw new Error(
        `Validation Failed: Expected section questions count to be 2, got ${firstSection.questions.length}`,
      );
    }

    // Check sequentially
    console.log("--> Testing navigation index traversal simulation...");
    const allQuestions = uiTestInstance.sections.flatMap((s) => s.questions);
    for (let i = 0; i < allQuestions.length; i++) {
      const q = allQuestions[i];
      console.log(
        `   [Nav Index ${i}] Question ID: ${q.id}, Text: "${q.text.substring(0, 30)}..."`,
      );
      if (q.orderIndex !== i) {
        throw new Error(
          `Validation Failed: Expected sequential orderIndex ${i}, got ${q.orderIndex}`,
        );
      }
      if (!q.text) {
        throw new Error(
          `Validation Failed: Question text missing in snapshot for question ID ${q.id}`,
        );
      }
      if (q.options.length !== 4) {
        throw new Error(
          `Validation Failed: Expected exactly 4 options for MCQ, got ${q.options.length}`,
        );
      }
    }

    console.log("✅ Execution timer verified: 1800 seconds");
    console.log("✅ Progress state sequence verified.");
    console.log("✅ All UI-level contract mapping schemas: PASS");

    console.log("\n==========================================");
    console.log("EXECUTION READY");
    console.log("==========================================\n");
    process.exit(0);
  } catch (err: any) {
    console.error("\n==========================================");
    console.error("EXECUTION BLOCKED");
    console.error(err.message || err);
    console.error("==========================================\n");
    process.exit(1);
  } finally {
    console.log("--> Cleaning up dummy data...");
    if (dummyUserId) {
      await prisma.testInstance
        .deleteMany({ where: { userId: dummyUserId } })
        .catch(() => {});
      await prisma.user.delete({ where: { id: dummyUserId } }).catch(() => {});
    }
    if (testConfigId) {
      await prisma.testSection
        .deleteMany({ where: { testConfigId } })
        .catch(() => {});
      await prisma.testConfig
        .delete({ where: { id: testConfigId } })
        .catch(() => {});
    }
    for (const id of generatedQuestionIds) {
      await prisma.generatedQuestion.delete({ where: { id } }).catch(() => {});
    }
    if (templateId) {
      await prisma.template
        .delete({ where: { id: templateId } })
        .catch(() => {});
    }
    await disconnectPrisma();
  }
}

run();
