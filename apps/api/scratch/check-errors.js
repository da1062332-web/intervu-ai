const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const build = await prisma.runtimeBuild.findFirst({
    where: { status: "FAILED" },
    orderBy: { createdAt: "desc" },
  });
  console.log("Failed Build:", build);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
