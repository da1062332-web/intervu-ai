require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const q = await prisma.question.findFirst({
    where: { questionType: "CODING" }
  });
  console.log(JSON.stringify(q, null, 2));
}

main().finally(() => prisma.$disconnect());
