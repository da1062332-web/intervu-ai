import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const ids = ['flmp1ehafmr7wo9vpovc5bko', 'cmsycqds000cbrprekxbdgvhk'];
  for (const id of ids) {
    const inst = await prisma.testInstance.findUnique({
      where: { id },
      include: {
        submission: true,
      },
    });
    console.log(`\n================================`);
    console.log(`Instance ID: ${id}`);
    console.log(`Status: ${inst?.status}`);
    console.log(`Candidate: ${inst?.candidateName} (${inst?.candidateEmail})`);
    console.log(`ExamConfig: ${inst?.examConfigId}`);
    console.log(`Submission:`, inst?.submission);
  }
}

main().finally(() => prisma.$disconnect());
