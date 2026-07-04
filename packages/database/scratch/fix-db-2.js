const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const qs2 = await prisma.question.findMany({
    where: { id: { startsWith: "mock-q-" } },
  });
  console.log("Mock questions in Question:", qs2.length);

  if (qs2.length > 0) {
    await prisma.question.deleteMany({
      where: { id: { startsWith: "mock-q-" } },
    });
    console.log("Deleted mock questions from Question");
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
