const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- FINDING ALL QUESTION MEDIA ---');
  const mediaList = await prisma.questionMedia.findMany({
    take: 100
  });
  console.log(`Found ${mediaList.length} media records in QuestionMedia table.`);
  for (const m of mediaList.slice(0, 10)) {
    console.log(m);
  }

  // Also search templates whose name or key is related to figure series
  const templates = await prisma.template.findMany({
    where: {
      OR: [
        { name: { contains: 'Alternating Shape' } },
        { id: 'cmul3gs0j000nlb0axdw7gqaj' }
      ]
    }
  });
  console.log('Templates found:', JSON.stringify(templates, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
