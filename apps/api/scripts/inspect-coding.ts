import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=========================================");
  console.log("INSPECTING CODING QUESTIONS AND ASSESSMENT STRUCTURE");
  console.log("=========================================\n");

  const topics = await prisma.topic.findMany({
    where: { name: { contains: "Coding", mode: "insensitive" } }
  });
  console.log("Coding topics:", topics);

  const testConfigs = await prisma.testConfig.findMany({
    where: { displayName: { contains: "Coding", mode: "insensitive" } },
    include: { sections: true }
  });
  console.log("Coding TestConfigs:", testConfigs);

}

main().finally(() => prisma.$disconnect());
