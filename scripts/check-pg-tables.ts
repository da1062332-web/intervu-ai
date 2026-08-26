import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkTables() {
  const tables: any[] = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;
  console.log("Postgres Tables in public schema:");
  console.log(tables.map(t => t.table_name).join(", "));
}

checkTables().catch(console.error).finally(() => prisma.$disconnect());
