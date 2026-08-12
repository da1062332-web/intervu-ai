import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== FIXING EMPTY OPTIONS FOR LEGACY MCQ QUESTIONS ===");

  // 1. Fix Question 1: "63 units of work" (cmsmtc9tv002152otttonko3t)
  const q1Options = [
    { id: "opt1", text: "150", isCorrect: false },
    { id: "opt2", text: "155", isCorrect: false },
    { id: "opt3", text: "149.16", isCorrect: true },
    { id: "opt4", text: "145", isCorrect: false },
  ];

  await prisma.question.update({
    where: { id: "cmsmtc9tv002152otttonko3t" },
    data: {
      answer: "opt3",
      mcqData: {
        options: q1Options,
        correctAnswer: "opt3",
      },
    },
  });
  console.log("Fixed Question 1 (63 units of work...) in Question table ✅");

  // 2. Fix Question 2: "The average of 61 items is 79" (cmsj6d1e7002ptsy9zrinssz9)
  const q2Options = [
    { id: "opt1", text: "4819", isCorrect: true },
    { id: "opt2", text: "4820", isCorrect: false },
    { id: "opt3", text: "4815", isCorrect: false },
    { id: "opt4", text: "4825", isCorrect: false },
  ];

  await prisma.question.update({
    where: { id: "cmsj6d1e7002ptsy9zrinssz9" },
    data: {
      answer: "opt1",
      mcqData: {
        options: q2Options,
        correctAnswer: "opt1",
      },
    },
  });
  console.log("Fixed Question 2 (The average of 61 items is 79...) in Question table ✅");

  // 3. Fix active TestInstance section question snapshots in database so candidate UI displays options immediately
  const activeInstances = await prisma.testInstance.findMany({
    where: { status: "IN_PROGRESS" },
    include: {
      sections: {
        include: { questions: true },
      },
    },
  });

  console.log(`\nUpdating ${activeInstances.length} IN_PROGRESS TestInstance snapshot(s)...`);
  for (const inst of activeInstances) {
    for (const sec of inst.sections) {
      for (const q of sec.questions) {
        if (q.questionId === "cmsmtc9tv002152otttonko3t") {
          const snap = (q.questionSnapshot as any) || {};
          snap.options = q1Options;
          snap.mcqData = { options: q1Options, correctAnswer: "opt3" };
          await prisma.testInstanceQuestion.update({
            where: { id: q.id },
            data: { questionSnapshot: snap },
          });
          console.log(`Updated snapshot for Question 70 in TestInstance ${inst.id} ✅`);
        }
        if (q.questionId === "cmsj6d1e7002ptsy9zrinssz9") {
          const snap = (q.questionSnapshot as any) || {};
          snap.options = q2Options;
          snap.mcqData = { options: q2Options, correctAnswer: "opt1" };
          await prisma.testInstanceQuestion.update({
            where: { id: q.id },
            data: { questionSnapshot: snap },
          });
          console.log(`Updated snapshot for Question (Average of 61 items...) in TestInstance ${inst.id} ✅`);
        }
      }
    }
  }

  console.log("\nAll empty options fixes completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error fixing empty options:", e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
