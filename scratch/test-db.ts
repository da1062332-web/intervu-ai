import { PrismaClient } from "@prisma/client";

async function testConn(url: string, name: string) {
  console.log(`Testing ${name}...`);
  const client = new PrismaClient({
    datasources: { db: { url } },
  });
  try {
    const res = await client.$queryRaw`SELECT 1 as connected;`;
    console.log(`SUCCESS ${name}:`, res);
  } catch (e: any) {
    console.error(`FAILED ${name}:`, e.message);
  } finally {
    await client.$disconnect();
  }
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }
  await testConn(dbUrl, "Primary Database Connection");
}

main();
