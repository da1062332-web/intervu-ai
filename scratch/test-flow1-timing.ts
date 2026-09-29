import { PrismaClient, Prisma } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

const prisma = new PrismaClient();

async function testCloneFlow1() {
  const configId = "cmsifafam000099s9csfe33pg";
  const masterId = "cmukwewzb0bjmop63i99q1bct";
  const user = await prisma.user.findFirst();
  const userId = user!.id;

  // Fetch reusable once (as cached in memory)
  const master = await prisma.assembledTest.findUnique({
    where: { id: masterId },
    include: {
      sections: {
        include: { questions: { orderBy: { questionOrder: "asc" } } },
        orderBy: { orderIndex: "asc" }
      }
    }
  });

  console.log(`Master loaded: ${master?.sections.length} sections, ${master?.totalQuestions} questions`);

  // Now measure candidate clone (this is what runs on each start)
  const t0 = Date.now();
  const testInstanceId = createId();
  const expiresAt = new Date(Date.now() + 7800 * 1000);

  const sectionRows: any[] = [];
  const questionRows: any[] = [];

  for (let i = 0; i < master!.sections.length; i++) {
    const sec = master!.sections[i];
    const secId = createId();
    sectionRows.push({
      id: secId,
      testInstanceId,
      sectionKey: sec.sectionKey,
      sectionName: sec.sectionName,
      durationSeconds: sec.durationSeconds,
      questionCount: sec.questions.length,
      orderIndex: i,
      status: i === 0 ? "ACTIVE" : "UPCOMING",
    });

    for (let qIdx = 0; qIdx < sec.questions.length; qIdx++) {
      const q = sec.questions[qIdx];
      questionRows.push({
        testInstanceId,
        sectionId: secId,
        questionId: q.questionId,
        questionOrder: qIdx,
        questionSnapshot: q.questionSnapshot || {},
      });
    }
  }

  const queries = [
    prisma.testInstance.create({
      data: {
        id: testInstanceId,
        userId,
        examConfigId: configId,
        status: "CREATED",
        expiresAt,
      },
    }),
    prisma.testInstanceSection.createMany({ data: sectionRows }),
    prisma.testInstanceQuestion.createMany({ data: questionRows }),
    prisma.executionState.create({
      data: {
        testInstanceId,
        currentQuestionIndex: 0,
        currentSectionIndex: 0,
        currentSectionKey: master!.sections[0].sectionKey,
        remainingTimeSeconds: 7800,
        lockedSectionKeys: [],
        markedQuestions: [],
        visitedQuestions: [],
      },
    }),
  ];

  await prisma.$transaction(queries);
  const dur = Date.now() - t0;
  console.log(`Candidate Clone Duration: ${dur}ms | Instance ID: ${testInstanceId}`);

  // Cleanup
  await prisma.testInstanceQuestion.deleteMany({ where: { testInstanceId } });
  await prisma.testInstanceSection.deleteMany({ where: { testInstanceId } });
  await prisma.executionState.deleteMany({ where: { testInstanceId } });
  await prisma.testInstance.delete({ where: { id: testInstanceId } });
}

testCloneFlow1().finally(() => prisma.$disconnect());
