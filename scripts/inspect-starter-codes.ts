import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectJavaStarterCodes() {
  const ids = ["cmt4bgn6s000fzju63untxp9j", "cmt4bj5rx0001tcvtl13lpqv0", "cmt4bjjtz000htcvtfrcquk7y"];
  for (const id of ids) {
    const q = await prisma.question.findUnique({ where: { id } });
    if (!q) continue;
    const cd = (q.codingData || {}) as any;
    console.log(`\n================ Question: ${q.id} | ${q.questionTitle} ================`);
    console.log("Java starterCode:\n", cd.starterCode?.java);
    console.log("Python starterCode:\n", cd.starterCode?.python);
    console.log("C++ starterCode:\n", cd.starterCode?.cpp);
  }
}

inspectJavaStarterCodes().catch(console.error).finally(() => prisma.$disconnect());
