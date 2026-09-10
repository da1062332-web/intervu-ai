import { PrismaClient } from "@prisma/client";

const directUrl =
  process.env.DIRECT_URL ||
  "postgresql://postgres.ayklmzeqfezrlbkdusqc:MARVEL7ace%4077090@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

const prisma = new PrismaClient({
  datasources: { db: { url: directUrl } },
});

async function main() {
  console.log("=== REMEDIATING CODING QUESTION SNAPSHOTS (OPTIMIZED) ===");

  // 1. Fetch master coding questions
  const codingQuestions = await prisma.question.findMany({
    where: {
      OR: [
        { questionType: "CODING" },
        { codingData: { not: PrismaClient.DbNull as any } },
      ],
    },
  });

  const questionMap = new Map<string, any>();
  const codingIds: string[] = [];
  for (const q of codingQuestions) {
    questionMap.set(q.id, q);
    codingIds.push(q.id);
  }
  console.log(`Found ${codingQuestions.length} master coding questions in Question table.`);

  // 2. Fetch only TestInstanceQuestions matching coding questions or coding sections
  const tiqs = await prisma.testInstanceQuestion.findMany({
    where: {
      OR: [
        { questionId: { in: codingIds } },
        { section: { sectionKey: { contains: "coding", mode: "insensitive" } } },
        { section: { sectionName: { contains: "coding", mode: "insensitive" } } },
      ],
    },
  });

  console.log(`Found ${tiqs.length} TestInstanceQuestions to inspect/update.`);

  const updates: Array<{ id: string; snapshot: any }> = [];
  for (const tiq of tiqs) {
    const masterQ = questionMap.get(tiq.questionId);
    if (!masterQ) continue;

    const currentSnap = (tiq.questionSnapshot as Record<string, any>) || {};
    const hasValidCodingData = !!(
      currentSnap.codingData &&
      (Array.isArray(currentSnap.codingData.publicTests) || currentSnap.codingData.oracleKey)
    );

    if (!hasValidCodingData) {
      const codingData = masterQ.codingData || masterQ.metadata?.codingData || masterQ.metadata;
      const updatedSnap = {
        ...currentSnap,
        questionType: "CODING",
        codingData: codingData || undefined,
        questionText: currentSnap.questionText || masterQ.questionText,
        questionStatement: currentSnap.questionStatement || masterQ.questionStatement,
        instructions: currentSnap.instructions || masterQ.instructions,
      };

      updates.push({ id: tiq.id, snapshot: updatedSnap });
    }
  }

  console.log(`Prepared ${updates.length} records needing update. Executing in parallel batches...`);

  // Batch update in parallel chunks of 20
  const chunkSize = 20;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map((item) =>
        prisma.testInstanceQuestion.update({
          where: { id: item.id },
          data: { questionSnapshot: item.snapshot },
        }),
      ),
    );
    console.log(`Updated ${Math.min(i + chunkSize, updates.length)} / ${updates.length} records.`);
  }

  // 3. Verify test instance f8tye95fb0tp143mdcyweqf7
  const candidateTIQs = await prisma.testInstanceQuestion.findMany({
    where: { testInstanceId: "f8tye95fb0tp143mdcyweqf7", section: { sectionKey: "Coding" } },
  });
  for (const cTiq of candidateTIQs) {
    const snap = cTiq.questionSnapshot as any;
    console.log(`\nCandidate TIQ ${cTiq.questionId}:`);
    console.log(`- has codingData:`, !!snap.codingData);
    console.log(`- publicTests count:`, snap.codingData?.publicTests?.length);
    console.log(`- starterCode keys:`, Object.keys(snap.codingData?.starterCode || {}));
  }

  console.log("\n=== REMEDIATION COMPLETE ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());
