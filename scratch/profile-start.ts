import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function profileStartSteps() {
  const configId = "cmsifafam000099s9csfe33pg";
  const user = await prisma.user.findFirst();
  const userId = user!.id;

  console.log("=== PROFILING CANDIDATE START STEPS (direct to DB) ===");

  console.time("1. isVipUser");
  await prisma.user.findUnique({ where: { id: userId }, select: { email: true, role: true } });
  console.timeEnd("1. isVipUser");

  console.time("2. userQuotaOverride");
  await prisma.userQuotaOverride.findMany({ where: { userId } });
  console.timeEnd("2. userQuotaOverride");

  console.time("3. Subscription.findFirst");
  const sub = await prisma.subscription.findFirst({ where: { userId } });
  console.timeEnd("3. Subscription.findFirst");

  console.time("4. UsageQuota.findFirst");
  await prisma.usageQuota.findFirst({ where: { userId } });
  console.timeEnd("4. UsageQuota.findFirst");

  console.time("5. Active test check");
  await prisma.testInstance.findFirst({
    where: {
      userId,
      examConfigId: configId,
      status: { in: ["CREATED", "IN_PROGRESS", "ADMIN_REVIEW", "RESUME_AUTHORIZED", "RESUMED", "AUTO_SUBMITTED"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  console.timeEnd("5. Active test check");

  console.time("6. countAttempts");
  await prisma.testInstance.count({
    where: {
      userId,
      OR: [{ examConfigId: configId }, { testConfigId: configId }],
      status: { in: ["SUBMITTED", "COMPLETED"] },
    },
  });
  console.timeEnd("6. countAttempts");

  console.time("7. Assembly master fetch");
  const master = await prisma.assembledTest.findUnique({
    where: { id: "cmukwewzb0bjmop63i99q1bct" },
    include: {
      sections: {
        include: { questions: { orderBy: { questionOrder: "asc" } } },
        orderBy: { orderIndex: "asc" }
      }
    }
  });
  console.timeEnd("7. Assembly master fetch");
  console.log("Master questions count:", master?.sections.reduce((s, x) => s + x.questions.length, 0));
}

profileStartSteps().finally(() => prisma.$disconnect());
