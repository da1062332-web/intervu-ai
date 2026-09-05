import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });
dotenv.config({ path: path.resolve(__dirname, '../packages/database/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const configId = 'cms5x7a3q0044139ug61gcjh6';
  const config = await prisma.examConfig.findUnique({
    where: { id: configId },
    include: {
      sections: {
        include: {
          sectionTopics: {
            include: {
              topic: {
                include: {
                  concepts: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!config) {
    console.log('Config not found');
    return;
  }

  console.log(`\n========================================`);
  console.log(`Config: "${config.name}" (ID: ${config.id})`);
  console.log(`========================================`);

  for (const sec of config.sections) {
    console.log(`\nSection: ${sec.name} (${sec.code}) | Required Questions: ${sec.questionCount}`);
    for (const st of sec.sectionTopics) {
      const topic = st.topic;
      const conceptCodes = topic.concepts.map(c => c.code);
      const allCodes = [topic.code, ...conceptCodes];

      // Check available questions in question pool / Question table for this topic
      const questions = await prisma.question.findMany({
        where: {
          OR: [
            { topicId: topic.id },
            { concept: { in: allCodes } },
            { metadata: { path: ['topicCode'], equals: topic.code } }
          ],
          deletedAt: null,
          isActive: true
        },
        take: 50
      });

      // Also check GeneratedQuestion / Templates
      const templates = await prisma.template.count({
        where: {
          conceptKey: { in: allCodes },
          isActive: true,
          deletedAt: null
        }
      });

      console.log(`  - Topic: "${topic.name}" (${topic.code}) | Questions in DB: ${questions.length} | Templates: ${templates}`);

      // Inspect question options
      let missingOptionsCount = 0;
      for (const q of questions) {
        const snap = (q.questionSnapshot as any) || q;
        const opts = snap.options || snap.choices || snap.mcqData?.options || snap.mcqData?.choices || q.options;
        const isObjective = ['MCQ', 'MSQ', 'MULTIPLE_CHOICE'].includes(String(q.type || snap.type || snap.questionType).toUpperCase());

        if (isObjective) {
          const hasValidOptions = Array.isArray(opts) && opts.length > 0;
          if (!hasValidOptions) {
            missingOptionsCount++;
            console.log(`    ⚠️ Question ID ${q.id} (Type: ${q.type}) HAS NO OPTIONS! Snapshot:`, JSON.stringify(snap).slice(0, 200));
          }
        }
      }

      if (missingOptionsCount > 0) {
        console.log(`    ❌ ${missingOptionsCount} questions in topic "${topic.name}" have missing options!`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
