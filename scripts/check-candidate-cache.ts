import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== CANDIDATE DASHBOARD QUERY & CACHE DIAGNOSIS ===");

  // 1. Check ExamConfig table in DB
  const publishedConfigs = await prisma.examConfig.findMany({
    where: { isArchived: false, isActive: true, status: "PUBLISHED" },
    select: { id: true, name: true, code: true, status: true },
  });

  console.log(`\n1. Published ExamConfigs in Database (${publishedConfigs.length}):`);
  for (const c of publishedConfigs) {
    console.log(`  - [${c.code}] ${c.name} (ID: ${c.id})`);
  }

  // 2. Check AssembledTest table in DB
  const publishedAssemblies = await prisma.assembledTest.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, configId: true, status: true },
  });

  console.log(`\n2. Published AssembledTests in Database (${publishedAssemblies.length}):`);
  for (const a of publishedAssemblies) {
    console.log(`  - Assembly ID: ${a.id}, Config ID: ${a.configId}`);
  }

  // 3. Check ExamConfig for TCS NQT specifically
  const tcsConfig = await prisma.examConfig.findFirst({
    where: { OR: [{ code: "TCS_NQT_PLACEMENT_ASSESSMENT" }, { name: { contains: "TCS NQT Placement Assessment" } }] },
  });

  console.log(`\n3. TCS NQT ExamConfig Status: "${tcsConfig?.status}"`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
