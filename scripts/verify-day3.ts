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
  console.log("Running Day 3 Master Verification");
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

  let assemblyPass = false;
  let executionPass = false;
  let assessmentPass = false;

  const scriptsDir = __dirname;
  const runner = "npx tsx";

  // 1. Assembly Verification
  try {
    console.log("--> Running verify-assembly.ts");
    execSync(`${runner} ${path.join(scriptsDir, "verify-assembly.ts")}`, {
      stdio: "inherit",
    });
    assemblyPass = true;
  } catch (err) {
    console.error("verify-assembly.ts failed.");
  }

  // 2. Execution Verification
  try {
    console.log("\n--> Running verify-execution.ts");
    execSync(`${runner} ${path.join(scriptsDir, "verify-execution.ts")}`, {
      stdio: "inherit",
    });
    executionPass = true;
  } catch (err) {
    console.error("verify-execution.ts failed.");
  }

  // 3. Assessment Verification
  try {
    console.log("\n--> Running verify-assessment.ts");
    execSync(`${runner} ${path.join(scriptsDir, "verify-assessment.ts")}`, {
      stdio: "inherit",
    });
    assessmentPass = true;
  } catch (err) {
    console.error("verify-assessment.ts failed.");
  }

  // Cleanup API if we started it
  if (serverProcess) {
    console.log("Stopping API server...");
    serverProcess.kill();
  }

  // Report
  console.log("\n====================");
  console.log(`Assembly: ${assemblyPass ? "PASS" : "FAIL"}`);
  console.log(`Execution: ${executionPass ? "PASS" : "FAIL"}`);
  console.log(`Assessment: ${assessmentPass ? "PASS" : "FAIL"}`);
  
  const allPass = assemblyPass && executionPass && assessmentPass;
  console.log(`OVERALL: ${allPass ? "PASS" : "FAIL"}`);
  console.log("====================");

  if (allPass) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runMasterVerification();
