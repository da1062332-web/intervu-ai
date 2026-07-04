const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const qs = await prisma.generatedQuestion.findMany({
    where: { id: { startsWith: "mock-q-" } },
  });
  console.log("Mock questions in GeneratedQuestion:", qs.length);

  if (qs.length > 0) {
    await prisma.generatedQuestion.deleteMany({
      where: { id: { startsWith: "mock-q-" } },
    });
    console.log("Deleted mock questions from GeneratedQuestion");
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
