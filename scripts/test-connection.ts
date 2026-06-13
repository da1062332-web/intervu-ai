import { PrismaClient } from "@prisma/client";

const URLS = [
  "postgresql://postgres:postgres@localhost:5432/intervu_ai",
  "postgresql://postgres:MARVEL7ace@localhost:5432/intervu_ai",
  "postgresql://postgres:MARVEL7ace@77090@localhost:5432/intervu_ai",
  "postgresql://postgres:MARVEL7ace%4077090@localhost:5432/intervu_ai",
  "postgresql://postgres:postgres@127.0.0.1:5432/intervu_ai",
  "postgresql://postgres:MARVEL7ace@127.0.0.1:5432/intervu_ai",
  "postgresql://postgres:MARVEL7ace@77090@127.0.0.1:5432/intervu_ai",
  "postgresql://postgres:MARVEL7ace%4077090@127.0.0.1:5432/intervu_ai"
];

async function testConnections() {
  console.log("Testing connection URLs...");
  for (const url of URLS) {
    console.log(`URL: ${url.replace(/:[^:@]+@/, ":****@")}`);
    const client = new PrismaClient({
      datasources: { db: { url } }
    });

    try {
      await client.$connect();
      console.log("✅ SUCCESS!");
      await client.$disconnect();
      return;
    } catch (error: any) {
      console.log(`❌ FAILED: ${error.message.split("\n")[0]}`);
    } finally {
      await client.$disconnect();
    }
  }
}

testConnections();
