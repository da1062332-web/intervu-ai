import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Publishing TCS NQT Placement Assessment in DB ===");

  const updated = await prisma.examConfig.updateMany({
    where: { OR: [{ code: "TCS_NQT_PLACEMENT_ASSESSMENT" }, { name: { contains: "TCS NQT Placement Assessment" } }] },
    data: { status: "PUBLISHED", isActive: true, isArchived: false },
  });

  console.log(`Updated ${updated.count} config(s) status to "PUBLISHED".`);

  const published = await prisma.examConfig.findFirst({
    where: { OR: [{ code: "TCS_NQT_PLACEMENT_ASSESSMENT" }, { name: { contains: "TCS NQT Placement Assessment" } }] },
  });

  console.log("\nUpdated DB Record Status:");
  console.log(`- ID: ${published?.id}`);
  console.log(`- Name: ${published?.name}`);
  console.log(`- Code: ${published?.code}`);
  console.log(`- Status: "${published?.status}" ✅`);
  console.log(`- isActive: ${published?.isActive} ✅`);
  console.log(`- isArchived: ${published?.isArchived} ✅`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
