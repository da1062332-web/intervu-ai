import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });
dotenv.config({ path: path.resolve(__dirname, '../packages/database/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.examConfig.findMany({
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

  console.log(`Found ${configs.length} ExamConfigs:`);
  for (const c of configs) {
    console.log(`\nID: ${c.id} | Code: ${c.code} | Name: "${c.name}" | Status: ${c.status}`);
    for (const sec of c.sections) {
      console.log(`  Section: ${sec.name} (${sec.code}) - ${sec.questionCount} questions`);
      for (const st of sec.sectionTopics) {
        console.log(`    - Topic: ${st.topic.name} (${st.topic.code})`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
