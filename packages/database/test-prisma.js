const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const assemblyId = "cmqux2wvx0002h9ojrza2vqf8";
  try {
    const at = await prisma.assembledTest.findUnique({
      where: { id: assemblyId },
    });
    const ti = await prisma.testInstance.findUnique({
      where: { id: assemblyId },
    });
    console.log("AssembledTest:", at);
    console.log("TestInstance:", ti);
  } catch (e) {
    console.error("Prisma Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
