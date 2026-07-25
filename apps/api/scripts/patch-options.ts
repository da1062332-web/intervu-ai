import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const questions = await prisma.question.findMany({
      where: { source: "GENERATED" }
    });
    let updated = 0;
    for (const q of questions) {
      const meta = q.metadata as any;
      const mcq = q.mcqData as any;
      if (meta?.datasetItem?.options?.length > 0 && (!mcq || !mcq.options || mcq.options.length === 0)) {
        await prisma.question.update({
          where: { id: q.id },
          data: { mcqData: { ...(mcq || {}), options: meta.datasetItem.options } }
        });
        updated++;
      }
    }
    console.log("Patched Questions:", updated);

    const genQs = await prisma.generatedQuestion.findMany();
    let updatedGen = 0;
    for (const q of genQs) {
      const meta = q.metadata as any;
      if (meta?.datasetItem?.options?.length > 0 && (!q.options || (Array.isArray(q.options) && q.options.length === 0))) {
        await prisma.generatedQuestion.update({
          where: { id: q.id },
          data: { options: meta.datasetItem.options }
        });
        updatedGen++;
      }
    }
    console.log("Patched GeneratedQuestions:", updatedGen);
}
main().catch(console.error).finally(() => prisma.$disconnect());
