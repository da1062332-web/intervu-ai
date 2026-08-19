const net = require("net");

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

async function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function main() {
  console.log("Searching for active Supabase region pooler (port 6543)...");
  const projectRef = "ayklmzeqfezrlbkdusqc";
  const pass = process.env.DB_PASSWORD || "postgres";

  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    process.stdout.write(`Testing ${host}... `);
    const isOpen = await checkPort(host, 6543);
    if (isOpen) {
      console.log("SUCCESS!");
      const url = `postgresql://postgres.${projectRef}:${pass}@${host}:6543/postgres?pgbouncer=true`;
      console.log(`\nFound pooler URL: \n${url}\n`);

      const fs = require("fs");
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
      console.log("Failed.");
    }
  }
  console.log("Could not find active pooler.");
}

main();
