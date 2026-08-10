import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  let updatedTIQ = 0;
  let updatedATQ = 0;

  // 1. Patch TestInstanceQuestion records
  const tiQuestions = await prisma.testInstanceQuestion.findMany();
  for (const tiq of tiQuestions) {
    const snapshot: any = tiq.questionSnapshot;
    if (snapshot && (!snapshot.options || snapshot.options.length === 0)) {
      const questionId = snapshot.id || snapshot.questionHash || tiq.questionId;
      if (!questionId) continue;

      const q = await prisma.question.findUnique({ where: { id: questionId } });
      if (q && q.mcqData) {
        const mcq: any = q.mcqData;
        if (mcq.options && mcq.options.length > 0) {
          snapshot.options = mcq.options;
          await prisma.testInstanceQuestion.update({
            where: { id: tiq.id },
            data: { questionSnapshot: snapshot },
          });
          updatedTIQ++;
        }
      }
    }
  }

  // 2. Patch AssembledTestQuestion records
  const atQuestions = await prisma.assembledTestQuestion.findMany();
  for (const atq of atQuestions) {
    const snapshot: any = atq.questionSnapshot;
    if (snapshot && (!snapshot.options || snapshot.options.length === 0)) {
      const questionId = snapshot.id || snapshot.questionHash || atq.questionId;
      if (!questionId) continue;

      const q = await prisma.question.findUnique({ where: { id: questionId } });
      if (q && q.mcqData) {
        const mcq: any = q.mcqData;
        if (mcq.options && mcq.options.length > 0) {
          snapshot.options = mcq.options;
          await prisma.assembledTestQuestion.update({
            where: { id: atq.id },
            data: { questionSnapshot: snapshot },
          });
          updatedATQ++;
        }
      }
    }
  }

  console.log(`Patched ${updatedTIQ} TestInstanceQuestion snapshots!`);
  console.log(`Patched ${updatedATQ} AssembledTestQuestion snapshots!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
