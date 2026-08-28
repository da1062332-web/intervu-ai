import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectCodingInBank() {
  const ids = ["cmt4bgn6s000fzju63untxp9j", "cmt4bj5rx0001tcvtl13lpqv0", "cmt4bjjtz000htcvtfrcquk7y"];
  for (const id of ids) {
    const q = await prisma.question.findUnique({ where: { id } });
    if (!q) {
      console.log(`Question ${id} NOT found in Question table!`);
      continue;
    }
    const cd = (q.codingData || {}) as any;
    console.log(`\n================ Question: ${q.id} | ${q.questionTitle} ================`);
    console.log("Public Tests:", JSON.stringify(cd.publicTests, null, 2));
    console.log("Hidden Tests:", JSON.stringify(cd.hiddenTests, null, 2));
    console.log("Boundary Tests:", JSON.stringify(cd.boundaryTests, null, 2));
    console.log("Stress Tests:", JSON.stringify(cd.stressTests, null, 2));
  }
}

inspectCodingInBank().catch(console.error).finally(() => prisma.$disconnect());
