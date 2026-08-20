import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOracleDb() {
  const oracles = await prisma.codingOracle.findMany({
    select: {
      id: true,
      key: true,
      name: true,
      category: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log('--- CURRENT DB RECORDS IN coding_oracles ---');
  console.log(`Total count: ${oracles.length}`);
  console.log(JSON.stringify(oracles, null, 2));
}

checkOracleDb()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
