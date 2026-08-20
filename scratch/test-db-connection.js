const { Client } = require("pg");

const hosts = [
  "db.ayklmzeqfezrlbkdusqc.supabase.co",
  "aws-0-ap-south-1.pooler.supabase.com",
  "aws-0-us-east-1.pooler.supabase.com",
  "aws-0-eu-central-1.pooler.supabase.com",
  "aws-0-ap-southeast-1.pooler.supabase.com",
];

const passwords = [process.env.DB_PASSWORD || "postgres"];

async function testConfig(host, port, user, pass) {
  const connectionString = `postgresql://${user}:${encodeURIComponent(pass)}@${host}:${port}/postgres?connect_timeout=5`;
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 4000,
  });

  try {
    await client.connect();
    console.log(`SUCCESS: connected to ${host}:${port} as ${user}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`FAIL ${host}:${port} (${user}): ${err.code || err.message}`);
    return false;
  }
}

async function main() {
  console.log("--- TESTING DIRECT HOST ---");
  for (const pass of passwords) {
    await testConfig(
      "db.ayklmzeqfezrlbkdusqc.supabase.co",
      5432,
      "postgres",
      pass,
    );
    await testConfig(
      "db.ayklmzeqfezrlbkdusqc.supabase.co",
      6543,
      "postgres",
      pass,
    );
  }

  console.log("\n--- TESTING POOLER HOSTS WITH POSTGRES.<REF> ---");
  const user = "postgres.ayklmzeqfezrlbkdusqc";
  for (const host of hosts) {
    if (host.includes("pooler")) {
      for (const pass of passwords) {
        await testConfig(host, 6543, user, pass);
        await testConfig(host, 5432, user, pass);
      }
    }
  }
}

main().catch(console.error);
