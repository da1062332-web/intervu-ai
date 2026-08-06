const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: './apps/api/.env' });

console.log("Testing with DATABASE_URL:", process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("PRISMA SUCCESS: Connected successfully!");
    const count = await prisma.user.count();
    console.log("User count:", count);
  } catch (err) {
    console.error("PRISMA ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
