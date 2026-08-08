import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const genQ = await prisma.generatedQuestion.findMany({
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  if (genQ.length > 0) {
    console.log("Most recent GeneratedQuestion:");
    console.log("Question ID:", genQ[0].id);
    console.log("Question Text:", genQ[0].questionText);
    console.log("Options:", genQ[0].options);
    console.log("Metadata:", JSON.stringify(genQ[0].metadata, null, 2));
  }

  const dsItem = await prisma.datasetItem.findFirst({
    where: {
      content: { contains: "sweets every day and no one could believe" },
    },
  });
  if (dsItem) {
    console.log("\nFound corresponding DatasetItem:");
    console.log("Options in DB:", dsItem.options);
    console.log("Metadata:", dsItem.metadata);
  } else {
    console.log("\nDatasetItem not found.");
  }
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
