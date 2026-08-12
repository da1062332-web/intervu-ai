import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== DIAGNOSING CANDIDATE VISIBILITY FOR TCS NQT ASSESSMENT ===");

  const config = await prisma.examConfig.findFirst({
    where: { OR: [{ code: "TCS_NQT_PLACEMENT_ASSESSMENT" }, { name: { contains: "TCS NQT Placement Assessment" } }] },
  });

  if (!config) {
    console.log("❌ ExamConfig NOT FOUND.");
    return;
  }

  console.log("\n1. ExamConfig DB Record:");
  console.log(`- ID: ${config.id}`);
  console.log(`- Name: ${config.name}`);
  console.log(`- Code: ${config.code}`);
  console.log(`- status: "${config.status}"`);
  console.log(`- isActive: ${config.isActive}`);
  console.log(`- isArchived: ${config.isArchived}`);

  // Check candidate visibility filters: status === 'PUBLISHED' && isActive === true && isArchived === false
  const isVisibleForCandidate = config.status === "PUBLISHED" && config.isActive === true && !config.isArchived;

  console.log(`\n2. Candidate Visibility Filter Evaluation:`);
  console.log(`- status === 'PUBLISHED' : ${config.status === "PUBLISHED" ? "PASS ✅" : `FAIL ❌ (Current: ${config.status})`}`);
  console.log(`- isActive === true     : ${config.isActive === true ? "PASS ✅" : `FAIL ❌ (Current: ${config.isActive})`}`);
  console.log(`- isArchived === false  : ${!config.isArchived ? "PASS ✅" : `FAIL ❌ (Current: ${config.isArchived})`}`);

  console.log(`\n3. Final Candidate Visibility Verdict:`);
  if (isVisibleForCandidate) {
    console.log("✅ The config matches all database candidate visibility filters.");
  } else {
    console.log("❌ The config IS NOT VISIBLE to candidates due to the failing filter(s) above!");
  }

  // Also check if there is a corresponding TestConfig record (legacy or test config model)
  const testConfig = await prisma.testConfig.findFirst({
    where: { OR: [{ code: "TCS_NQT_PLACEMENT_ASSESSMENT" }, { name: { contains: "TCS NQT Placement Assessment" } }] },
  });

  if (testConfig) {
    console.log("\n4. TestConfig Record:");
    console.log(`- ID: ${testConfig.id}`);
    console.log(`- status: "${testConfig.status}"`);
    console.log(`- isActive: ${testConfig.isActive}`);
  } else {
    console.log("\n4. TestConfig Record: None found (uses ExamConfig).");
  }

  // Also check candidate assessment list API queries
  const publishedCount = await prisma.examConfig.count({
    where: { status: "PUBLISHED", isActive: true, isArchived: false },
  });
  console.log(`\n5. Total Published & Active ExamConfigs in DB: ${publishedCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
