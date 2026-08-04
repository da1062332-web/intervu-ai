import { PrismaClient } from '@prisma/client';

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
  await testConn(
    "postgresql://postgres:MARVEL7ace%4077090@db.ayklmzeqfezrlbkdusqc.supabase.co:5432/postgres?connect_timeout=30&pool_timeout=30&connection_limit=5",
    "Direct port 5432 with limit 5"
  );
  await testConn(
    "postgresql://postgres:MARVEL7ace%4077090@db.ayklmzeqfezrlbkdusqc.supabase.co:5432/postgres?connect_timeout=15",
    "Direct port 5432 timeout 15"
  );
  await testConn(
    "postgresql://postgres.ayklmzeqfezrlbkdusqc:MARVEL7ace%4077090@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=30",
    "Pooler port 6543"
  );
  await testConn(
    "postgresql://postgres.ayklmzeqfezrlbkdusqc:MARVEL7ace%4077090@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?connect_timeout=30",
    "Session Pooler port 5432"
  );
}

main();
