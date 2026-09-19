import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });
dotenv.config({ path: path.resolve(__dirname, '../packages/database/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const attempts = await prisma.testInstance.findMany({
    where: {
      user: { email: { contains: 'qloax-cand' } }
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: {
      id: true,
      status: true,
      expiresAt: true,
      createdAt: true,
      submittedAt: true,
      user: { select: { email: true } },
      submissions: {
        select: {
          id: true,
          status: true,
          source: true,
          reason: true,
          isAutoSubmit: true,
          createdAt: true
        }
      }
    }
  });

  console.log(`Found ${attempts.length} attempts:`);
  for (const a of attempts) {
    console.log(`-------------------------------------------------------------------`);
    console.log(`ID: ${a.id} | Email: ${a.user?.email}`);
    console.log(`TestInstance Status: ${a.status} | CreatedAt: ${a.createdAt} | SubmittedAt: ${a.submittedAt}`);
    console.log(`ExpiresAt: ${a.expiresAt}`);
    console.log(`Submissions count: ${a.submissions.length}`);
    for (const s of a.submissions) {
      console.log(`  -> Submission ID: ${s.id} | Status: ${s.status} | Source: ${s.source} | Reason: ${s.reason} | isAutoSubmit: ${s.isAutoSubmit}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
