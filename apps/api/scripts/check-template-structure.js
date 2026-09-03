require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const t = await prisma.template.findFirst({
    where: { questionType: 'multiple_choice' }
  });
  console.log(JSON.stringify(t, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
