import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const questions = await prisma.question.findMany({
      where: { source: "GENERATED" }
    });
    let updated = 0;
    for (const q of questions) {
      const meta = q.metadata as any;
      if (meta?._generatedQuestionId) {
        const genQ = await prisma.generatedQuestion.findUnique({
          where: { id: meta._generatedQuestionId }
        });
        
        const mcq = q.mcqData as any;
        const hasOptions = mcq && mcq.options && mcq.options.length > 0;

        if (genQ && genQ.options && Array.isArray(genQ.options) && genQ.options.length > 0 && !hasOptions) {
          await prisma.question.update({
            where: { id: q.id },
            data: { mcqData: { ...(mcq || {}), options: genQ.options } }
          });
          updated++;
        }
      }
    }
    console.log("Patched Questions from GeneratedQuestion:", updated);
}
main().catch(console.error).finally(() => prisma.$disconnect());
