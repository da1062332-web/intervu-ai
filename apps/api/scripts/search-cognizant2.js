require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.examConfig.findMany({
    where: { name: { contains: "Cognizant" } },
    include: { sections: true }
  });
  console.log("ExamConfigs:", JSON.stringify(configs, null, 2));

  const assemblies = await prisma.testAssembly.findMany({
    where: { title: { contains: "Cognizant" } }
  });
  console.log("TestAssemblies:", JSON.stringify(assemblies, null, 2));
}

main().finally(() => prisma.$disconnect());
