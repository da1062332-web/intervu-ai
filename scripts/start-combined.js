const { execSync, spawn } = require("child_process");
const http = require("http");
const path = require("path");

console.log("🚀 Starting Combined API & Worker Bootstrap...");

// Automatically start Judge0 Ngrok Tunnel if running locally or enabled via env
function autoStartJudge0Tunnel() {
  const shouldStart =
    process.env.AUTO_START_NGROK === "true" ||
    process.env.START_NGROK_TUNNEL === "true" ||
    (process.env.NODE_ENV !== "production" && process.platform === "win32");

  if (!shouldStart) return;

  const staticDomain =
    process.env.JUDGE0_NGROK_DOMAIN || "marbled-fifty-unraveled.ngrok-free.dev";
  const localPort = process.env.JUDGE0_LOCAL_PORT || 2358;

  console.log(
    `🌐 [Ngrok] Auto-initiating Judge0 tunnel (domain: ${staticDomain}, port: ${localPort})...`
  );

  try {
    const tunnel = spawn(
      "npx",
      ["ngrok", "http", `--domain=${staticDomain}`, String(localPort)],
      {
        shell: true,
        detached: true,
        stdio: "ignore",
      }
    );
    tunnel.unref();
    console.log("✅ [Ngrok] Judge0 tunnel process spawned in background.");
  } catch (err) {
    console.warn("⚠️ [Ngrok] Tunnel spawn notice:", err.message);
  }
}

autoStartJudge0Tunnel();

// 1. Validate Environment Variables (Item 2)
const REQUIRED_ENV = [
  "DATABASE_URL",
  "DIRECT_URL",
  "REDIS_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "WORKER_CONCURRENCY",
];

const missingEnv = REQUIRED_ENV.filter((env) => !process.env[env]);
if (missingEnv.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingEnv.join(", ")}`,
  );
  process.exit(1);
}
console.log("✅ Environment variables validated.");

// 2. Run Database Migrations (Post-Build, Pre-Start) (Item 1 & 6)
try {
  console.log("🔄 Running database migrations...");
  execSync(
    "npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma",
    { stdio: "inherit" },
  );
  console.log("✅ Database migrations completed successfully.");
} catch (error) {
  console.error("❌ Database migration failed:", error);
  process.exit(1);
}

// 3. Start NestJS API
console.log("🚀 Bootstrapping NestJS API...");
require(path.join(__dirname, "../apps/api/dist/apps/api/src/main"));

// 4. Poll API Health check to confirm startup before loading the Worker (Item 4)
const port = process.env.PORT || 7860;
const healthUrl = `http://127.0.0.1:${port}/api/v1/health`;
let attempts = 0;
const maxAttempts = 90; // 90 seconds max timeout (Render free-tier cold start)

function pollAPI() {
  attempts++;
  http
    .get(healthUrl, (res) => {
      if (res.statusCode === 200) {
        console.log("✅ API is healthy. Starting Background Worker...");
        startWorker();
      } else {
        retry();
      }
    })
    .on("error", () => {
      retry();
    });
}

function retry() {
  if (attempts >= maxAttempts) {
    console.error(
      `❌ API failed to become healthy within ${maxAttempts} seconds. Exiting.`,
    );
    process.exit(1);
  }
  setTimeout(pollAPI, 1000);
}

function startWorker() {
  try {
    require(path.join(__dirname, "../apps/worker/dist/apps/worker/src/main"));
    console.log("🚀 Worker bootstrapped successfully.");
    global.isWorkerInitialized = true; // Sets flag for readiness checks
  } catch (error) {
    console.error("❌ Failed to start worker:", error);
    process.exit(1);
  }
}

pollAPI();
