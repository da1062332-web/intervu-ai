import { PrismaClient } from '@prisma/client';
import * as StandardOracles from '../apps/api/src/modules/coding/oracles/standard-oracles';

const prisma = new PrismaClient();

async function seedAllOracles() {
  console.log('================================================================');
  console.log('   SEEDING ALL 95 TCS ADVANCED CODING ORACLES TO DATABASE       ');
  console.log('================================================================\n');

  const oracleClasses = Object.values(StandardOracles).filter(
    (item) => typeof item === 'function' && item.prototype,
  ) as any[];

  console.log(`Found ${oracleClasses.length} Oracle classes in StandardOracles barrel export.`);

  const validKeys = new Set<string>();
  let insertedCount = 0;
  let updatedCount = 0;

  for (const OracleCls of oracleClasses) {
    const instance = new OracleCls();
    const key = instance.key;
    validKeys.add(key);
    const name = instance.name;
    const category = instance.category || 'GENERAL';
    const description = instance.description || '';
    const supportedDifficulties = instance.supportedDifficulties || ['EASY', 'MEDIUM', 'HARD'];
    const parameterSchema = instance.parameterSchema || {};

    const existing = await prisma.codingOracle.findUnique({
      where: { key },
    });

    if (existing) {
      await prisma.codingOracle.update({
        where: { key },
        data: {
          name,
          category,
          description,
          supportedDifficulties,
          parameterSchema,
          isActive: true,
          isSystem: true,
          deletedAt: null,
        },
      });
      updatedCount++;
    } else {
      await prisma.codingOracle.create({
        data: {
          key,
          name,
          category,
          description,
          supportedDifficulties,
          parameterSchema,
          metadata: {},
          isActive: true,
          isSystem: true,
          version: 1,
        },
      });
      insertedCount++;
    }
  }

  // Cleanup any legacy or stale DB records not in validKeys
  const allDbOracles = await prisma.codingOracle.findMany({});
  const staleOracles = allDbOracles.filter((o) => !validKeys.has(o.key));
  if (staleOracles.length > 0) {
    const staleIds = staleOracles.map((o) => o.id);
    await prisma.codingOracle.deleteMany({
      where: { id: { in: staleIds } },
    });
    console.log(`Cleaned up ${staleOracles.length} stale/legacy Oracle records from DB.`);
  }

  const totalInDb = await prisma.codingOracle.count({
    where: { deletedAt: null },
  });

  console.log(`\n✅ Database seeding complete!`);
  console.log(`- Newly inserted: ${insertedCount}`);
  console.log(`- Updated: ${updatedCount}`);
  console.log(`- Total active in DB: ${totalInDb} (Expected: 95)`);
}

seedAllOracles()
  .catch((e) => {
    console.error('❌ Error seeding oracles:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
