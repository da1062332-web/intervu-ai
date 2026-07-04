const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const qs = await prisma.generatedQuestion.findMany({
    where: { id: { startsWith: "mock-q-" } },
  });
  console.log("Mock questions in GeneratedQuestion:", qs.length);

  if (qs.length > 0) {
    for (const q of qs) {
      await prisma.generatedQuestion.update({
        where: { id: q.id },
        data: {
          options: [
            { id: "opt1", text: "Option A" },
            { id: "opt2", text: "Option B" },
          ],
          correctAnswer: "opt1",
          solution: "Mock solution",
        },
      });
    }
    console.log("Updated GeneratedQuestion mock options");
  }

  // Same for Question table if any
  const qs2 = await prisma.question.findMany({
    where: { id: { startsWith: "mock-q-" } },
  });
  console.log("Mock questions in Question:", qs2.length);

  if (qs2.length > 0) {
    for (const q of qs2) {
      const md = q.metadata || {};
      md.options = md.options || [
        { id: "opt1", text: "A" },
        { id: "opt2", text: "B" },
      ];
      await prisma.question.update({
        where: { id: q.id },
        data: { metadata: md },
      });
    }
    console.log("Updated Question mock options");
  }

  // Same for AssembledTestQuestion to fix existing tests
  const qs3 = await prisma.assembledTestQuestion.findMany({
    where: { questionId: { startsWith: "mock-q-" } },
  });
  console.log("Mock questions in AssembledTestQuestion:", qs3.length);
  if (qs3.length > 0) {
    for (const q of qs3) {
      const snap = q.questionSnapshot || {};
      snap.options = [
        { id: "opt1", text: "A" },
        { id: "opt2", text: "B" },
      ];
      snap.correctAnswer = "opt1";
      snap.solution = "Sol";
      await prisma.assembledTestQuestion.update({
        where: { id: q.id },
        data: { questionSnapshot: snap },
      });
    }
    console.log("Updated AssembledTestQuestion snapshots");
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
