import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkPools() {
  console.log("================================================================================");
  console.log("📊 QUERYING PRE-GENERATED TEST POOL & ASSEMBLED TEST STATUSES");
  console.log("================================================================================\n");

  // 1. PregeneratedTestInstances count
  try {
    const pregenCount = await (prisma as any).pregeneratedTestInstance.count();
    const pregenByStatus = await (prisma as any).pregeneratedTestInstance.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const pregenByConfig = await (prisma as any).pregeneratedTestInstance.groupBy({
      by: ["configId", "status"],
      _count: { id: true },
    });

    console.log(`📦 Total PregeneratedTestInstance records: ${pregenCount}`);
    console.log("Breakdown by status:", pregenByStatus);
    console.log("Breakdown by config:", pregenByConfig);
  } catch (e: any) {
    console.log("📦 PregeneratedTestInstance table: Not yet migrated to DB (0 pool records)");
  }

  // 2. Published AssembledTest records (Reusable Master Templates)
  const assembledByStatus = await prisma.assembledTest.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const publishedAssemblies = await prisma.assembledTest.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      configId: true,
      totalDurationSeconds: true,
      totalQuestions: true,
      createdAt: true,
      examConfig: {
        select: {
          name: true,
          status: true,
        },
      },
    },
  });

  console.log("\n📋 AssembledTest (Master Assembly Snapshots) breakdown by status:");
  console.log(assembledByStatus);

  console.log(`\n✨ PUBLISHED Master Assemblies available for instant cloning (${publishedAssemblies.length}):`);
  publishedAssemblies.forEach((a, i) => {
    console.log(
      `  [${i + 1}] ID: ${a.id} | Config: "${a.examConfig?.name || a.configId}" (${a.configId}) | Questions: ${a.totalQuestions} | Duration: ${a.totalDurationSeconds}s | Created: ${a.createdAt.toISOString()}`
    );
  });

  // 3. ExamConfigs
  const examConfigStats = await prisma.examConfig.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  console.log("\n⚙️ ExamConfig breakdown by status:", examConfigStats);

  console.log("\n================================================================================");
}

checkPools()
  .catch((err) => {
    console.error("Error querying database:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
