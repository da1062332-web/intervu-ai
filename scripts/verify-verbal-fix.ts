import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkVerbalSnapshots() {
  const ids = ["cmt9ljknx0010s1uqbj1cfjdu", "cmt9ljknx0011s1uqsk5hyxha"];
  const tiqs = await prisma.testInstanceQuestion.findMany({
    where: { id: { in: ids } }
  });
  for (const t of tiqs) {
    console.log("==========================================");
    console.log("TIQ ID:", t.id);
    console.log("Question Order:", t.questionOrder);
    console.log("Question Text:", (t.questionSnapshot as any)?.questionText);
    console.log("Snapshot options:", (t.questionSnapshot as any)?.options);
    console.log("Snapshot mcqData:", JSON.stringify((t.questionSnapshot as any)?.mcqData, null, 2));
  }
}

checkVerbalSnapshots().catch(console.error).finally(() => prisma.$disconnect());
