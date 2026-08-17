import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Checking Current Question Pool for Grammar & Idioms ===");

  const grammarTopic = await prisma.topic.findFirst({
    where: { OR: [{ id: "2048b41a-57f5-447f-a58a-ea135705c913" }, { code: "GRAMMAR" }] },
  });

  const idiomsTopic = await prisma.topic.findFirst({
    where: { OR: [{ id: "4ec340a2-a346-4479-8529-95a4fb966c71" }, { code: "IDIOMS_AND_PHRASES" }] },
  });

  if (grammarTopic) {
    const medCount = await prisma.question.count({
      where: { topicId: grammarTopic.id, difficulty: "MEDIUM", status: "ACTIVE" },
    });
    console.log(`Grammar (${grammarTopic.id}): Active MEDIUM = ${medCount} (Required: 3)`);
  }

  if (idiomsTopic) {
    const medCount = await prisma.question.count({
      where: { topicId: idiomsTopic.id, difficulty: "MEDIUM", status: "ACTIVE" },
    });
    console.log(`Idioms and phrases (${idiomsTopic.id}): Active MEDIUM = ${medCount} (Required: 3)`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
