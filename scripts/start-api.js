// Set Node.js threadpool size early before any native addons or async I/O initialize
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || "16";

const { execSync, spawn } = require("child_process");
const path = require("path");

console.log("🚀 Starting API Bootstrap...");

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

// 1. Validate Environment Variables
const REQUIRED_ENV = [
  "DATABASE_URL",
  "DIRECT_URL",
  "REDIS_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
];

const missingEnv = REQUIRED_ENV.filter((env) => !process.env[env]);
if (missingEnv.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingEnv.join(", ")}`,
  );
  process.exit(1);
}
console.log("✅ Environment variables validated.");

process.env.INTERNAL_SERVICE_TOKEN =
  process.env.INTERNAL_SERVICE_TOKEN || "internal_secret_token";

const dbUrl = process.env.DATABASE_URL || "";
if (dbUrl.includes(":6543")) {
  console.log("⚡ [Database] Supabase Transaction Pooler (:6543) detected — pooling enabled.");
} else if (dbUrl.includes("supabase.co:5432")) {
  console.warn("⚠️ [Database] Using direct Supabase connection (:5432). For optimal speed on Render, use port 6543 with ?pgbouncer=true.");
}

// 2. Run Database Migrations (Post-Build, Pre-Start).
// This service is the single source of truth for schema state: with the API
// and worker now deployed as separate Render services, only the API runs
// migrations. The worker's own start script waits on the API's health
// endpoint before booting, so it never races a schema that isn't ready yet.
try {
  console.log("🔄 Running database migrations...");
  execSync(
    "npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma",
    { stdio: "inherit" },
  );
  console.log("✅ Database migrations completed successfully.");
} catch (error) {
  console.warn(
    "⚠️ Initial migrate deploy failed, attempting automatic recovery for stuck migrations..."
  );
  const stuckMigrations = ["20260918120000_add_media_assets"];
  for (const mig of stuckMigrations) {
    try {
      console.log(`🔧 Attempting migrate resolve --rolled-back "${mig}"...`);
      execSync(
        `npx prisma migrate resolve --rolled-back "${mig}" --schema=packages/database/prisma/schema.prisma`,
        { stdio: "inherit" }
      );
    } catch (e) {
      // Ignore if not in failed state
    }
  }

  try {
    console.log("🔄 Retrying database migrations...");
    execSync(
      "npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma",
      { stdio: "inherit" },
    );
    console.log("✅ Database migrations completed successfully after recovery.");
  } catch (retryError) {
    console.error("❌ Database migration failed:", retryError);
    process.exit(1);
  }
}

// 3. Start NestJS API
console.log("🚀 Bootstrapping NestJS API...");
require(path.join(__dirname, "../apps/api/dist/apps/api/src/main"));
