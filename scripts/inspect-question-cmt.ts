import { PrismaClient } from "@prisma/client";

const directUrl =
  process.env.DIRECT_URL ||
  "postgresql://postgres.ayklmzeqfezrlbkdusqc:MARVEL7ace%4077090@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

const prisma = new PrismaClient({
  datasources: { db: { url: directUrl } },
});

async function main() {
  const qId = "cmt4bkdi4001ntcvtrs9r8029";
  console.log("=== QUESTION 1 IN DB ===");
  const q = await prisma.question.findUnique({ where: { id: qId } });
  console.log("Q1 ID:", q?.id);
  console.log("Q1 questionText:", q?.questionText);
  console.log("Q1 codingData:", JSON.stringify(q?.codingData, null, 2));
  console.log("Q1 metadata:", JSON.stringify(q?.metadata, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
