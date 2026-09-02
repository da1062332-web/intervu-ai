require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const id = "cmtjnof0s0000g22pvm27nrz2";
  const fullConfig = await prisma.examConfig.findUnique({
    where: { id },
    include: {
      sections: true,
      difficultyDistribution: true,
      ruleFlags: true,
      blueprint: {
        include: {
          styleProfile: true,
        },
      },
    },
  });

  console.log("Config from findUnique:", fullConfig ? "Found" : "Not Found");
  if (fullConfig) {
    console.log("Name:", fullConfig.name);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
