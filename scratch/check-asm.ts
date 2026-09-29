import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function check() {
  const configId = "cmsifafam000099s9csfe33pg";
  const ec = await prisma.examConfig.findUnique({ where: { id: configId }, select: { id: true, updatedAt: true, ruleFlags: true } });
  console.log("ExamConfig:", ec);
  const asm = await prisma.assembledTest.findFirst({
    where: { configId },
    orderBy: { createdAt: "desc" },
    select: { id: true, configId: true, status: true, totalQuestions: true, createdAt: true, updatedAt: true }
  });
  console.log("Latest Assembly:", asm);
  if (asm && ec) {
    console.log("asm.updatedAt:", asm.updatedAt.toISOString());
    console.log("ec.updatedAt: ", ec.updatedAt.toISOString());
    console.log("Is stale?", new Date(asm.updatedAt).getTime() < new Date(ec.updatedAt).getTime());
  }

  // Also check findLatestReusableByConfigId exact query:
  const reusable = await prisma.assembledTest.findFirst({
    where: {
      configId,
      totalQuestions: { gt: 0 },
      status: { in: ["PUBLISHED", "DRAFT"] },
      sections: {
        some: { questions: { some: {} } },
        none: { questions: { none: {} } },
      },
    },
    select: {
      id: true,
      configId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      examConfig: { select: { updatedAt: true, ruleFlags: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const pregenCount = await prisma.pregeneratedTestInstance.count();
  console.log("pregeneratedTestInstance count:", pregenCount);

  const inst = await prisma.testInstance.findUnique({
    where: { id: "ew296ci36c2do079w5ktahg3" },
    include: { sections: { include: { questions: true } } }
  });
  console.log("Sections:", inst?.sections.length);
  const qCount = inst?.sections.reduce((sum, s) => sum + s.questions.length, 0);
  console.log("Total Qs in ew296ci36c2do079w5ktahg3:", qCount);
}
check().finally(() => prisma.$disconnect());
