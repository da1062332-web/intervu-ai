const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: "./apps/api/.env" });

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("PRISMA SUCCESS: Connected successfully!");
  } catch (err) {
    console.error("PRISMA ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
