import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const exams = await prisma.examConfig.findMany({
    select: { id: true, name: true, status: true, isArchived: true, isActive: true },
  });
  console.table(exams);
}
main().catch(console.error).finally(() => prisma.());
