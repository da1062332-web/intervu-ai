import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });
dotenv.config({ path: path.resolve(__dirname, '../packages/database/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.examConfig.findFirst({
    where: {
      OR: [
        { code: 'QLOAX_ASSESSMENT' },
        { name: { contains: 'Qloax', mode: 'insensitive' } }
      ]
    },
    include: {
      sections: {
        include: {
          sectionTopics: {
            include: {
              topic: true
            }
          }
        }
      }
    }
  });

  if (!config) {
    console.log('Qloax Assessment not found!');
    return;
  }

  console.log(`\n======================================================`);
  console.log(`CONFIG: "${config.name}" (ID: ${config.id}, Code: ${config.code})`);
  console.log(`Total Questions: ${config.totalQuestions}, Duration: ${config.durationMinutes} min`);
  console.log(`======================================================`);

  for (const sec of config.sections) {
    console.log(`\n------------------------------------------------------`);
    console.log(`SECTION: "${sec.name}" (${sec.code}) | Target Question Count: ${sec.questionCount}`);
    console.log(`------------------------------------------------------`);
    
    for (const st of sec.sectionTopics) {
      const topic = st.topic;
      const questions = await prisma.question.findMany({
        where: {
          topicId: topic.id,
        }
      });

      const templates = await prisma.template.findMany({
        where: {
          conceptKey: topic.code,
          isActive: true
        }
      });

      console.log(`  Topic: "${topic.name}" (${topic.code}) -> Questions in Question pool: ${questions.length}, Templates: ${templates.length}`);

      for (const q of questions) {
        const mcqData = (q.mcqData as any) || {};
        const meta = (q.metadata as any) || {};
        const options = mcqData.options || mcqData.choices || meta.options || meta.choices;

        const isMcq = ['MCQ', 'MSQ', 'MULTIPLE_CHOICE'].includes(String(q.questionType).toUpperCase());
        if (isMcq) {
          if (!options || !Array.isArray(options) || options.length === 0) {
            console.log(`    ❌ [NO OPTIONS] Question ID: ${q.id} | Status: ${q.status} | Text: "${q.questionText.slice(0, 60)}..."`);
            console.log(`       mcqData:`, JSON.stringify(q.mcqData));
            console.log(`       metadata:`, JSON.stringify(q.metadata));
          } else {
            // Check if options have empty text
            const hasEmpty = options.some(o => {
              if (typeof o === 'string') return o.trim().length === 0;
              if (typeof o === 'object' && o !== null) {
                return !o.text && !o.value && !o.label && !o.option && !o.content;
              }
              return true;
            });
            if (hasEmpty) {
              console.log(`    ⚠️ [EMPTY OPTION TEXT] Question ID: ${q.id} | Options:`, JSON.stringify(options));
            }
          }
        }
      }
    }
  }

  // Also inspect latest AssembledTest / TestInstance questions
  console.log(`\n======================================================`);
  console.log(`INSPECTING LATEST ASSEMBLED TEST INSTANCES FOR QLOAX`);
  console.log(`======================================================`);
  const instances = await prisma.testInstance.findMany({
    where: { examConfigId: config.id },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      sections: {
        include: {
          questions: true
        }
      }
    }
  });

  console.log(`Found ${instances.length} recent test instances`);
  for (const inst of instances) {
    console.log(`\nInstance ID: ${inst.id} | Status: ${inst.status} | Created: ${inst.createdAt}`);
    for (const sec of inst.sections) {
      console.log(`  Section: ${sec.sectionName} (Order: ${sec.orderIndex}, Questions: ${sec.questions.length})`);
      for (const tq of sec.questions) {
        const snap = (tq.questionSnapshot as any) || {};
        const options = snap.options || snap.choices || snap.mcqData?.options || snap.mcqData?.choices || snap.metadata?.options;
        const qType = String(snap.questionType || snap.type || 'MCQ').toUpperCase();
        const isMcq = ['MCQ', 'MSQ', 'MULTIPLE_CHOICE'].includes(qType);
        
        if (isMcq && (!options || !Array.isArray(options) || options.length === 0)) {
          console.log(`    ❌ [INSTANCE QUESTION NO OPTIONS] Question ID: ${tq.questionId} (Order: ${tq.questionOrder}) Type: ${qType}`);
          console.log(`       Snapshot keys:`, Object.keys(snap));
          console.log(`       Snapshot snippet:`, JSON.stringify(snap).slice(0, 300));
        }
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
