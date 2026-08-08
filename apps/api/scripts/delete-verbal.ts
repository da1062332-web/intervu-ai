import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const concept = await prisma.concept.findFirst({
    where: { name: { contains: "Verbal" } },
  });
  if (!concept) return console.log("Concept not found");

  await prisma.generatedQuestion.deleteMany({
    where: { conceptKey: concept.code },
  });
  await prisma.question.deleteMany({
    where: {
      topic: { concepts: { some: { id: concept.id } } },
      source: "GENERATED",
    },
  });
  console.log("Deleted questions for Verbal Ability");
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
