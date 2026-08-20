const { Client } = require("pg");
const fs = require("fs");

const regions = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "ap-south-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-northeast-2",
  "ca-central-1",
  "sa-east-1",
];

const projectRef = "ayklmzeqfezrlbkdusqc";
const pass = process.env.DB_PASSWORD || "postgres";

async function checkAuth(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const url = `postgresql://postgres.${projectRef}:${pass}@${host}:6543/postgres?pgbouncer=true`;
  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    await client.end();
    return url;
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log(
    "Searching for correct Supabase region pooler by authenticating...",
  );
  for (const region of regions) {
    process.stdout.write(`Testing ${region}... `);
    const url = await checkAuth(region);
    if (url) {
      console.log("SUCCESS!");
      console.log(`Found correct URL: \n${url}\n`);

      try {
        let envApi = fs.readFileSync("./apps/api/.env", "utf8");
        envApi = envApi.replace(/DATABASE_URL=.*/, `DATABASE_URL=${url}`);
        fs.writeFileSync("./apps/api/.env", envApi);

        let envDb = fs.readFileSync("./packages/database/.env", "utf8");
        envDb = envDb.replace(/DATABASE_URL=.*/, `DATABASE_URL=${url}`);
        fs.writeFileSync("./packages/database/.env", envDb);
        console.log("Successfully updated .env files!");
      } catch (e) {
        console.error("Failed to write .env files", e);
      }
      process.exit(0);
    } else {
      console.log("Failed (incorrect region).");
    }
  }
  console.log("Could not authenticate with any common region pooler.");
}

main();
