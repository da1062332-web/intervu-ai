import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkOtherSnapshotTables() {
  console.log("Checking other potential snapshot tables in Prisma schema...");

  // Check if AssembledTest / AssembledTestQuestion exist
  try {
    const assembledTests = await (prisma as any).assembledTest?.findMany({
      include: { questions: true }
    });
    if (assembledTests) {
      console.log(`Found ${assembledTests.length} AssembledTests`);
      let brokenAssembled = 0;
      for (const at of assembledTests) {
        for (const q of (at.questions || [])) {
          const snap = (q.questionSnapshot || {}) as any;
          const isMcq = (snap.questionType || snap.type || "").toUpperCase().includes("MCQ") || (snap.questionType || "").toUpperCase().includes("MULTIPLE_CHOICE");
          const opts = snap.options || snap.mcqData?.options || [];
          if (isMcq && (!Array.isArray(opts) || opts.length === 0)) {
            brokenAssembled++;
          }
        }
      }
      console.log(`Broken in AssembledTest: ${brokenAssembled}`);
    }
  } catch (e) {
    console.log("AssembledTest table not in active use or schema.");
  }

  // Check TestPackage if exists
  try {
    const testPackages = await (prisma as any).testPackage?.findMany();
    if (testPackages) {
      console.log(`Found ${testPackages.length} TestPackages`);
    }
  } catch (e) {}

  // Check QuestionBank datasets
  try {
    const datasetItems = await prisma.datasetItem.findMany();
    console.log(`\nDatasetItem Table: ${datasetItems.length} items`);
    let brokenDatasetItems = 0;
    for (const item of datasetItems) {
      const opts: any = item.options;
      if (!opts || (Array.isArray(opts) && opts.length === 0)) {
        brokenDatasetItems++;
      }
    }
    console.log(`Dataset items with empty options: ${brokenDatasetItems}`);
  } catch (e) {
    console.log("DatasetItem check:", e);
  }
}

checkOtherSnapshotTables().catch(console.error).finally(() => prisma.$disconnect());
