import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });
dotenv.config({ path: path.resolve(__dirname, '../packages/database/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.examConfig.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 10,
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

  for (const c of configs) {
    console.log(`\n========================================`);
    console.log(`CONFIG: "${c.name}" | ID: ${c.id} | Code: ${c.code} | Status: ${c.status}`);
    console.log(`========================================`);
    for (const sec of c.sections) {
      console.log(`  Section: ${sec.name} (Count: ${sec.questionCount})`);
      for (const st of sec.sectionTopics) {
        console.log(`    -> Topic: ${st.topic.name} (${st.topic.code})`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
