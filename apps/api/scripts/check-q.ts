import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  console.log("=== 1. Searching in Question ===");
  const questions = await prisma.question.findMany({
    where: {
      OR: [
        { questionText: { contains: "479" } },
        { questionText: { contains: "61%" } },
        { questionText: { contains: "LCM" } },
        { questionText: { contains: "fraction" } },
        { questionText: { contains: "32/9" } },
      ],
    },
  });
  console.log(`Found in Question: ${questions.length}`);
  for (const q of questions) {
    console.log(`\n--- Question [${q.id}] ---`);
    console.log(`Text: ${q.questionText}`);
    console.log(`Answer: ${q.answer}`);
    console.log(`mcqData:`, JSON.stringify(q.mcqData));
    console.log(`options:`, JSON.stringify((q as any).options));
    console.log(`metadata:`, JSON.stringify(q.metadata));
  }

  console.log("\n=== 2. Searching in GeneratedQuestion ===");
  const genQs = await prisma.generatedQuestion.findMany({
    where: {
      OR: [
        { questionText: { contains: "479" } },
        { questionText: { contains: "61%" } },
        { questionText: { contains: "LCM" } },
        { questionText: { contains: "fraction" } },
        { questionText: { contains: "32/9" } },
      ],
    },
  });
  console.log(`Found in GeneratedQuestion: ${genQs.length}`);
  for (const g of genQs) {
    console.log(`\n--- GeneratedQuestion [${g.id}] ---`);
    console.log(`TemplateId: ${g.templateId} | ConceptKey: ${g.conceptKey}`);
    console.log(`Text: ${g.questionText}`);
    console.log(`Options:`, JSON.stringify(g.options));
    console.log(`CorrectAnswer: ${g.correctAnswer}`);
    console.log(`Metadata:`, JSON.stringify(g.metadata));
  }

  console.log("\n=== 3. Searching for Template Fraction (FRACTION_LCM_HCF) ===");
  const t = await prisma.template.findFirst({
    where: { conceptKey: "FRACTION_LCM_HCF" },
    include: { rules: true, variables: true },
  });
  console.log(JSON.stringify(t, null, 2));
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
