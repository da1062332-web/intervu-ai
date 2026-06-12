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
  console.log("Running Day 4 Master Verification");
  console.log("==========================================\n");

  const API_URL = process.env.API_URL || "http://127.0.0.1:4000/api/v1";
  let serverProcess: ChildProcess | null = null;

  // Verify that the backend app boots up successfully (verifies NestJS modules/DI are sound)
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

  let autosavePass = false;
  let resumePass = false;
  let submissionPass = false;
  let evaluationPass = false;

  const scriptsDir = __dirname;
  const runner = "npx tsx";

  // 1. Autosave Verification
  try {
    console.log("--> Running verify-autosave.ts");
    execSync(`${runner} ${path.join(scriptsDir, "verify-autosave.ts")}`, {
      stdio: "inherit",
    });
    autosavePass = true;
  } catch (err) {
    console.error("verify-autosave.ts failed.");
  }

  // 2. Resume Verification
  try {
    console.log("\n--> Running verify-resume.ts");
    execSync(`${runner} ${path.join(scriptsDir, "verify-resume.ts")}`, {
      stdio: "inherit",
    });
    resumePass = true;
  } catch (err) {
    console.error("verify-resume.ts failed.");
  }

  // 3. Submission Verification
  try {
    console.log("\n--> Running verify-submission.ts");
    execSync(`${runner} ${path.join(scriptsDir, "verify-submission.ts")}`, {
      stdio: "inherit",
    });
    submissionPass = true;
  } catch (err) {
    console.error("verify-submission.ts failed.");
  }

  // 4. Evaluation Verification
  try {
    console.log("\n--> Running verify-evaluation.ts");
    execSync(`${runner} ${path.join(scriptsDir, "verify-evaluation.ts")}`, {
      stdio: "inherit",
    });
    evaluationPass = true;
  } catch (err) {
    console.error("verify-evaluation.ts failed.");
  }

  // Cleanup API if we started it
  if (serverProcess) {
    console.log("Stopping API server...");
    serverProcess.kill();
  }

  // Report
  console.log("\n====================");
  console.log(`Autosave: ${autosavePass ? "PASS" : "FAIL"}`);
  console.log(`Resume: ${resumePass ? "PASS" : "FAIL"}`);
  console.log(`Submission: ${submissionPass ? "PASS" : "FAIL"}`);
  console.log(`Evaluation: ${evaluationPass ? "PASS" : "FAIL"}`);
  
  const allPass = autosavePass && resumePass && submissionPass && evaluationPass;
  console.log(`OVERALL: ${allPass ? "PASS" : "FAIL"}`);
  console.log("====================");

  if (allPass) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runMasterVerification();
