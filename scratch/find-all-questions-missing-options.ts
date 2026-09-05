import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });
dotenv.config({ path: path.resolve(__dirname, '../packages/database/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const allQuestions = await prisma.question.findMany({
    include: {
      topic: true
    }
  });

  console.log(`Checking ${allQuestions.length} total questions in Question table...`);
  let invalidCount = 0;

  for (const q of allQuestions) {
    const isCoding = q.questionType === 'CODING' || q.topic?.name.toLowerCase().includes('coding') || q.topic?.code.toLowerCase().includes('coding');
    if (isCoding) continue;

    const mcqData = (q.mcqData as any) || {};
    const meta = (q.metadata as any) || {};
    const opts = mcqData.options || mcqData.choices || meta.options || meta.choices;

    if (!opts || !Array.isArray(opts) || opts.length === 0) {
      invalidCount++;
      console.log(`❌ [Question ${q.id}] Topic: ${q.topic?.name} (${q.topic?.code}) | Type: ${q.questionType}`);
      console.log(`   Text: "${q.questionText.slice(0, 80)}"`);
      console.log(`   mcqData:`, JSON.stringify(q.mcqData));
      console.log(`   metadata:`, JSON.stringify(q.metadata));
      console.log(`------------------------------------------------`);
    }
  }

  console.log(`\nTotal invalid questions in DB: ${invalidCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
