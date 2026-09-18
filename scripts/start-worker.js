const http = require("http");
const https = require("https");

console.log("🚀 Starting standalone Worker Bootstrap...");

const REQUIRED_ENV = ["REDIS_URL"];
const missingEnv = REQUIRED_ENV.filter((env) => !process.env[env]);
if (missingEnv.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingEnv.join(", ")}`,
  );
  process.exit(1);
}

process.env.INTERNAL_SERVICE_TOKEN =
  process.env.INTERNAL_SERVICE_TOKEN || "internal_secret_token";

// The worker calls back into the API over the network now that they're
// separate Render services (e.g. evaluation jobs delegate to the API's
// /evaluation/reprocess endpoint). Wait for the API to report healthy
// before processing jobs, so the first deploy doesn't race a still-booting
// API or an in-progress migration.
const apiBaseUrl = (
  process.env.INTERNAL_API_URL ||
  process.env.API_BASE_URL ||
  ""
).replace(/\/+$/, "");

function checkHealth(url) {
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForApi() {
  if (!apiBaseUrl) {
    console.warn(
      "⚠️ INTERNAL_API_URL not set — skipping API health wait. Evaluation jobs will fail until it's configured.",
    );
    return;
  }

  const healthUrl = apiBaseUrl.endsWith("/api/v1")
    ? `${apiBaseUrl}/health`
    : `${apiBaseUrl}/api/v1/health`;

  const maxAttempts = 90; // ~90s, matches the API's own cold-start budget
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (await checkHealth(healthUrl)) {
      console.log(`✅ API reachable at ${healthUrl}. Starting worker.`);
      return;
    }
    if (attempt === maxAttempts) {
      console.warn(
        `⚠️ API not reachable at ${healthUrl} after ${maxAttempts}s — starting worker anyway; jobs will retry/fail until it comes up.`,
      );
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function main() {
  await waitForApi();
  console.log("🚀 Bootstrapping Worker...");
  require("../apps/worker/dist/main");
  console.log("🚀 Worker bootstrapped successfully.");
}

main().catch((error) => {
  console.error("❌ Failed to start worker:", error);
  process.exit(1);
});
