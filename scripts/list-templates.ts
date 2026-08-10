import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.template.findMany({
    take: 10,
    select: { id: true, name: true, generationStrategy: true },
  });
  console.log("TEMPLATES IN DB:");
  console.log(JSON.stringify(templates, null, 2));

  const datasets = await prisma.dataset.findMany({
    take: 10,
    select: { id: true, name: true },
  });
  console.log("\nDATASETS IN DB:");
  console.log(JSON.stringify(datasets, null, 2));

  const datasetItems = await prisma.datasetItem.findMany({
    where: { datasetId: "cmrdb07ma005x94gqjnydv8em" },
    take: 3,
    select: { id: true, content: true },
  });
  console.log("\nDATASET ITEMS FOR cmrdb07ma005x94gqjnydv8em:");
  console.log(JSON.stringify(datasetItems, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
