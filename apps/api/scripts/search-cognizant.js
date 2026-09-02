require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.testConfig.findMany({
    where: { displayName: { contains: "Cognizant" } },
    include: { sections: true }
  });
  console.log(JSON.stringify(configs, null, 2));
}

main().finally(() => prisma.$disconnect());
