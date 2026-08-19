/**
 * fix-draft-assemblies-for-published-configs.ts
 *
 * One-time backfill: For every ExamConfig that is already PUBLISHED,
 * find its latest fully-assembled AssembledTest that is still in DRAFT
 * and promote it to PUBLISHED.
 *
 * This fixes the historical mismatch caused by ConfigPublisherService
 * not cascading the PUBLISHED status to AssembledTest.
 *
 * Safe to re-run — uses idempotent checks before updating.
 *
 * Usage:
 *   npx tsx scripts/fix-draft-assemblies-for-published-configs.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("==========================================================");
  console.log("🔍 Backfill: Fix DRAFT assemblies for PUBLISHED configs");
  console.log("==========================================================\n");

  // 1. Find all published ExamConfigs
  const publishedConfigs = await prisma.examConfig.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, name: true },
    orderBy: { updatedAt: "desc" },
  });

  console.log(`Found ${publishedConfigs.length} PUBLISHED ExamConfig(s). Scanning for DRAFT assemblies...\n`);

  let fixedCount = 0;
  let skippedCount = 0;
  let noAssemblyCount = 0;

  for (const config of publishedConfigs) {
    // 2. Find the latest complete assembly for this config that is still DRAFT
    const draftAssembly = await prisma.assembledTest.findFirst({
      where: {
        configId: config.id,
        status: "DRAFT",
        sections: {
          some: { questions: { some: {} } },
          none: { questions: { none: {} } },
        },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true, totalQuestions: true, createdAt: true },
    });

    if (!draftAssembly) {
      const publishedAssembly = await prisma.assembledTest.findFirst({
        where: { configId: config.id, status: "PUBLISHED" },
        select: { id: true },
      });

      if (publishedAssembly) {
        console.log(`  ✅ SKIP  | ${config.name} (${config.id}) — already has PUBLISHED assembly (${publishedAssembly.id})`);
        skippedCount++;
      } else {
        console.log(`  ⚠️  NONE  | ${config.name} (${config.id}) — no complete assembly found (not yet assembled)`);
        noAssemblyCount++;
      }
      continue;
    }

    // 3. Promote DRAFT → PUBLISHED
    await prisma.assembledTest.update({
      where: { id: draftAssembly.id },
      data: { status: "PUBLISHED" },
    });

    fixedCount++;
    console.log(
      `  🔧 FIXED | ${config.name} (${config.id})\n` +
      `           Assembly: ${draftAssembly.id} | Questions: ${draftAssembly.totalQuestions} | Created: ${draftAssembly.createdAt.toISOString()}`
    );
  }

  console.log("\n==========================================================");
  console.log(`✅ Done!`);
  console.log(`   Fixed:       ${fixedCount}`);
  console.log(`   Already OK:  ${skippedCount}`);
  console.log(`   No Assembly: ${noAssemblyCount}`);
  console.log("==========================================================");
}

main()
  .catch((err) => {
    console.error("❌ Backfill failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
