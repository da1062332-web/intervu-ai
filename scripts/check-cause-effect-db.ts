import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkQuestions() {
  const topic = await prisma.topic.findFirst({
    where: { code: "CAUSE_EFFECT" }
  });
  if (!topic) {
    console.log("No topic found for CAUSE_EFFECT");
    return;
  }
  const questions = await prisma.question.findMany({
    where: { topicId: topic.id }
  });
  console.log(`Found ${questions.length} questions for topicId ${topic.id}`);
  for (const q of questions) {
    console.log("ID:", q.id);
    console.log("Difficulty:", q.difficulty);
    console.log("Answer:", q.answer);
    console.log("mcqData:", JSON.stringify(q.mcqData));
    console.log("Text Snippet:", q.questionText.slice(0, 150));
    console.log("---");
  }
}

checkQuestions().catch(console.error).finally(() => prisma.$disconnect());
