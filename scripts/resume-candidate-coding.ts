import { PrismaClient } from "@prisma/client";

const directUrl =
  process.env.DIRECT_URL ||
  "postgresql://postgres.ayklmzeqfezrlbkdusqc:MARVEL7ace%4077090@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";
const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });

export async function resumeCandidateCoding(email: string, durationMinutes = 35) {
  console.log(`\n=== RESUMING TEST FOR CANDIDATE: ${email} ===\n`);

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: {
      testInstances: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sections: { orderBy: { orderIndex: "asc" } },
          questions: { orderBy: { questionOrder: "asc" } },
          submission: true,
          evaluationResult: true,
          candidateResult: true,
          evaluationAnalytics: true,
          executionState: true,
        },
      },
    },
  });

  if (!user || user.testInstances.length === 0) {
    throw new Error(`Candidate or test instance not found for ${email}`);
  }

  const instance = user.testInstances[0];
  const instanceId = instance.id;
  console.log(`Found TestInstance: ${instanceId} (Status: ${instance.status})`);

  // Find coding section and first coding question
  const codingSection = instance.sections.find(
    (s) => s.sectionKey === "Coding" || s.sectionKey.toLowerCase().includes("coding")
  );

  if (!codingSection) {
    throw new Error("Coding section not found in this test instance!");
  }

  const codingQuestions = instance.questions.filter((q) => q.sectionId === codingSection.id);
  const firstCodingQuestion = codingQuestions[0];

  console.log(`Coding section ID: ${codingSection.id}, Questions: ${codingQuestions.length}`);
  console.log(`First coding question ID: ${firstCodingQuestion?.questionId}`);

  const now = new Date();
  const durationSeconds = (codingSection.durationSeconds || 1800);
  const expiresAt = new Date(now.getTime() + (durationMinutes * 60 * 1000));

  const lockedKeys = instance.sections
    .filter((s) => s.id !== codingSection.id)
    .map((s) => s.sectionKey);

  console.log("Applying database updates in transaction...");

  await prisma.$transaction(
    async (tx) => {
    // 1. Delete premature evaluation and result records
    if (instance.evaluationAnalytics) {
      await tx.evaluationAnalytics.deleteMany({ where: { attemptId: instanceId } });
    }
    if (instance.candidateResult) {
      await tx.candidateResult.deleteMany({ where: { attemptId: instanceId } });
    }
    if (instance.evaluationResult) {
      await tx.skillScore.deleteMany({ where: { evaluationId: instance.evaluationResult.id } });
      await tx.recommendation.deleteMany({ where: { evaluationId: instance.evaluationResult.id } });
      await tx.evaluationResult.deleteMany({ where: { testInstanceId: instanceId } });
    }
    if (instance.submission) {
      await tx.submission.deleteMany({ where: { testInstanceId: instanceId } });
    }

    // 2. Lock all previous sections and set Coding section to ACTIVE
    for (const sec of instance.sections) {
      if (sec.id === codingSection.id) {
        await tx.testInstanceSection.update({
          where: { id: sec.id },
          data: {
            status: "ACTIVE",
            startedAt: now,
          },
        });
      } else {
        await tx.testInstanceSection.update({
          where: { id: sec.id },
          data: {
            status: "LOCKED",
          },
        });
      }
    }

    // 3. Update execution state to point to Coding section & first coding question
    const firstCodingIndex = instance.questions.findIndex((q) => q.sectionId === codingSection.id);
    const targetQIndex = firstCodingIndex >= 0 ? firstCodingIndex : 80;

    await tx.executionState.upsert({
      where: { testInstanceId: instanceId },
      update: {
        currentSectionIndex: instance.sections.findIndex((s) => s.id === codingSection.id),
        currentSectionKey: codingSection.sectionKey,
        currentQuestionIndex: targetQIndex,
        currentQuestionId: firstCodingQuestion?.questionId || null,
        remainingTimeSeconds: durationSeconds,
        sectionStartedAt: now,
        lockedSectionKeys: lockedKeys,
        lastActivityAt: now,
      },
      create: {
        testInstanceId: instanceId,
        currentSectionIndex: instance.sections.findIndex((s) => s.id === codingSection.id),
        currentSectionKey: codingSection.sectionKey,
        currentQuestionIndex: targetQIndex,
        currentQuestionId: firstCodingQuestion?.questionId || null,
        remainingTimeSeconds: durationSeconds,
        sectionStartedAt: now,
        lockedSectionKeys: lockedKeys,
        lastActivityAt: now,
      },
    });

    // 4. Update TestInstance status to IN_PROGRESS
    await tx.testInstance.update({
      where: { id: instanceId },
      data: {
        status: "IN_PROGRESS",
        submittedAt: null,
        expiresAt: expiresAt,
        updatedAt: now,
      },
    });
  },
  {
    timeout: 30000,
    maxWait: 15000,
  });

  console.log(`\n SUCCESS! Test instance ${instanceId} has been resumed for ${email}.`);
  console.log(`- Status: IN_PROGRESS`);
  console.log(`- Active Section: Coding (${codingQuestions.length} questions)`);
  console.log(`- Coding Timer: ${durationSeconds} seconds (${durationMinutes} min expiry buffer)`);
  console.log(`- Previous 4 sections: LOCKED (All ${user.testInstances[0].candidateAnswers.length} previous answers preserved)`);
}

async function main() {
  const email = "sgp230404@gmail.com";
  // Run the resumption
  await resumeCandidateCoding(email, 45);
}

if (require.main === module) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
