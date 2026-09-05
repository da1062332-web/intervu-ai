import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });
dotenv.config({ path: path.resolve(__dirname, '../packages/database/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const allQuestions = await prisma.question.findMany({
    take: 1500
  });

  console.log(`Analyzing ${allQuestions.length} questions for option structures...`);
  const shapes = new Set<string>();

  for (const q of allQuestions) {
    if (q.questionType === 'CODING') continue;
    const mcqData = (q.mcqData as any);
    const meta = (q.metadata as any);

    const isMcqArray = Array.isArray(mcqData?.options);
    const isMcqObj = mcqData?.options && typeof mcqData?.options === 'object' && !Array.isArray(mcqData?.options);
    const isMetaArray = Array.isArray(meta?.options);
    const isChoicesArray = Array.isArray(mcqData?.choices) || Array.isArray(meta?.choices);
    const isRawString = typeof mcqData?.options === 'string' || typeof meta?.options === 'string';

    const desc = `mcqArray:${isMcqArray}, mcqObj:${isMcqObj}, metaArray:${isMetaArray}, choicesArray:${isChoicesArray}, rawString:${isRawString}`;
    shapes.add(desc);

    // Also check if any questionText has A) B) C) D) inside text
    const text = q.questionText || '';
    if (text.includes('A)') && text.includes('B)') && (!mcqData?.options || mcqData?.options.length === 0)) {
      console.log(`Found question with options embedded in text but not in mcqData: ID ${q.id}`);
    }
  }

  console.log('Observed shapes in DB:');
  for (const s of shapes) {
    console.log('  -', s);
  }

  // Check AssembledTestQuestion table
  const assembledQuestions = await prisma.assembledTestQuestion.findMany({
    take: 200
  });
  console.log(`\nAnalyzing ${assembledQuestions.length} AssembledTestQuestion records...`);
  let assembledMissing = 0;
  for (const aq of assembledQuestions) {
    const snap = aq.questionSnapshot as any;
    if (!snap) {
      assembledMissing++;
      continue;
    }
    const qType = String(snap.questionType || snap.type || 'MCQ').toUpperCase();
    if (qType === 'CODING') continue;

    const opts = snap.options || snap.choices || snap.mcqData?.options || snap.metadata?.options;
    if (!opts || (Array.isArray(opts) && opts.length === 0)) {
      console.log(`AssembledTestQuestion ${aq.id} (Q: ${aq.questionId}) has NO options in snapshot:`, Object.keys(snap));
      assembledMissing++;
    }
  }
  console.log(`Assembled questions with missing options: ${assembledMissing}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
