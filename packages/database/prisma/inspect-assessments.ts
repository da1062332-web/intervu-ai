import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.template.findMany({
    select: { id: true, name: true, difficulty: true },
  });
  console.log('Templates in DB:', JSON.stringify(templates, null, 2));

  const blueprints = await prisma.blueprint.findMany({
    select: { id: true, name: true },
  });
  console.log('Blueprints in DB:', JSON.stringify(blueprints, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
