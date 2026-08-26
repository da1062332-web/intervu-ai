import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectLast8() {
  const ids = [
    "cmt72b3v4001hyndtcgwnp4lb",
    "cmt72b4ec001jyndtvrzyvurm",
    "cmt72b4zm001lyndt3nquq32u",
    "cmt72b6vu001nyndt18ayefbm",
    "cmt72b7i2001pyndtq8z468i9",
    "cmt72b8s6001ryndtrli5sp4y",
    "cmt72b9dp001tyndtu7o6io1j",
    "cmt72bc04001zyndtvkqw1py6"
  ];

  const questions = await prisma.question.findMany({
    where: { id: { in: ids } }
  });

  for (const q of questions) {
    console.log("==========================================");
    console.log("ID:", q.id);
    console.log("Title:", q.questionTitle);
    console.log("Text:", q.questionText);
    console.log("Answer Column:", q.answer);
    console.log("MCQ Data:", JSON.stringify(q.mcqData, null, 2));
    console.log("Metadata:", JSON.stringify(q.metadata, null, 2));
  }
}

inspectLast8().catch(console.error).finally(() => prisma.$disconnect());
