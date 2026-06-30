import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:MARVEL7ace%4077090@db.ayklmzeqfezrlbkdusqc.supabase.co:5432/postgres",
    },
  },
});

async function main() {
  try {
    const user = await prisma.user.findFirst();
    console.log(
      "DB connection successful! Found user:",
      user ? user.email : "none",
    );
  } catch (error) {
    console.error("DB connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
