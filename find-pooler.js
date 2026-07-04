const { Client } = require("pg");

const regions = [
  "ap-south-1",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-northeast-2",
  "ca-central-1",
  "sa-east-1",
];

const projectRef = "ayklmzeqfezrlbkdusqc";
const pass = "MARVEL7ace@77090";

async function testRegion(region) {
  const url = `postgresql://postgres.${projectRef}:${pass}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    console.log(`\n\nSUCCESS! The correct pooler URL is:`);
    console.log(`${url}?pgbouncer=true\n\n`);
    await client.end();
    return url;
  } catch (err) {
    // console.log(`Failed for ${region}`);
    return null;
  }
}

async function main() {
  console.log("Searching for correct Supabase region pooler...");
  for (const region of regions) {
    process.stdout.write(`Testing ${region}... `);
    const result = await testRegion(region);
    if (result) {
      process.exit(0);
    }
    console.log("Failed.");
  }
  console.log("Could not find region.");
}

main();
