import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });
dotenv.config({ path: path.resolve(__dirname, '../packages/database/.env') });
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const attempt = await prisma.testInstance.findFirst({
    where: { user: { email: { contains: 'qloax-cand' } } },
    orderBy: { createdAt: 'desc' },
    include: { sections: true, executionState: true, submissions: true, assessmentAuditLogs: { take: 10, orderBy: { createdAt: 'desc' } } }
  });
  console.log('Attempt ID:', attempt?.id);
  console.log('Attempt status:', attempt?.status);
  console.log('Attempt sections count:', attempt?.sections.length);
  for (const s of attempt?.sections || []) {
    console.log('Section:', s.sectionKey, s.sectionName, 'status:', s.status, 'startedAt:', s.startedAt);
  }
  console.log('Execution state:', attempt?.executionState);
  console.log('Submissions:', attempt?.submissions);
  console.log('Recent Audit Logs:');
  for (const l of attempt?.assessmentAuditLogs || []) {
    console.log('Audit Log:', l.eventType, l.source, l.actorRole, l.metadata);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
