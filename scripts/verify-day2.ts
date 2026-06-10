import { execSync, spawn, ChildProcess } from "child_process";
import path from "path";

async function ping(url: string) {
  try {
    const res = await fetch(url);
    return res.status === 200 || res.status === 400;
  } catch (e) {
    return false;
  }
}

async function runMasterVerification() {
  console.log("==========================================");
  console.log("Running Day 2 Master Verification");
  console.log("==========================================\n");

  const API_URL = process.env.API_URL || "http://127.0.0.1:4000/api/v1";
  let serverProcess: ChildProcess | null = null;

  if (!(await ping(`${API_URL}/health`))) {
    console.log("API not running. Starting API server for CI...");
    serverProcess = spawn("npm", ["run", "dev", "--workspace", "apps/api"], {
      stdio: "inherit",
      shell: true,
    });

    // Wait up to 30 seconds
    const start = Date.now();
    let up = false;
    while (Date.now() - start < 30000) {
      if (await ping(`${API_URL}/health`)) {
        up = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!up) {
      console.error("Failed to start API server. Exiting.");
      if (serverProcess) serverProcess.kill();
      process.exit(1);
    }
    console.log("API server is up.");
  }

  let generationPass = false;
  let storagePass = false;
  let testStartPass = false;

  const scriptsDir = __dirname;
  const runner = "npx tsx";

  // 1. Generation
  try {
    console.log("--> Running verify-generation.ts");
    execSync(`${runner} ${path.join(scriptsDir, "verify-generation.ts")}`, {
      stdio: "inherit",
    });
    generationPass = true;
  } catch (err) {
    console.error("verify-generation.ts failed.");
  }

  // 2. Storage
  try {
    console.log("\n--> Running verify-pool.ts");
    execSync(`${runner} ${path.join(scriptsDir, "verify-pool.ts")}`, {
      stdio: "inherit",
    });
    storagePass = true;
  } catch (err) {
    console.error("verify-pool.ts failed.");
  }

  // 3. Test Start API
  try {
    console.log("\n--> Running verify-start-test.ts");
    execSync(`${runner} ${path.join(scriptsDir, "verify-start-test.ts")}`, {
      stdio: "inherit",
    });
    testStartPass = true;
  } catch (err) {
    console.error("verify-start-test.ts failed.");
  }

  // Cleanup API if we started it
  if (serverProcess) {
    serverProcess.kill();
  }

  // Report
  console.log("\n====================");
  console.log(`Generation: ${generationPass ? "PASS" : "FAIL"}`);
  console.log(`Storage: ${storagePass ? "PASS" : "FAIL"}`);
  console.log(`Test Start: ${testStartPass ? "PASS" : "FAIL"}`);
  console.log("====================");

  const allPass = generationPass && storagePass && testStartPass;

  if (allPass) {
    console.log("\nDAY 2 READY");
    console.log("YES");
    process.exit(0);
  } else {
    console.log("\nDAY 2 READY");
    console.log("NO");
    process.exit(1);
  }
}

runMasterVerification();
