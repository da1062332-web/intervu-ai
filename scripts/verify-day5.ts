import { execSync } from "child_process";
import path from "path";

async function runMasterVerification() {
  console.log("==========================================");
  console.log("Running Day 5 Master Verification");
  console.log("==========================================\n");

  let resultsPass = false;
  let recommendationsPass = false;
  let historyPass = false;
  let insightsPass = false;

  const scriptsDir = __dirname;
  const runner = "node --import tsx";

  // 1. Results Verification
  try {
    console.log("--> Running verify-results.ts");
    execSync(`${runner} ${path.join(scriptsDir, "verify-results.ts")}`, {
      stdio: "inherit",
    });
    resultsPass = true;
  } catch (err) {
    console.error("verify-results.ts failed.");
  }

  // 2. Recommendations Verification
  try {
    console.log("\n--> Running verify-recommendations.ts");
    execSync(
      `${runner} ${path.join(scriptsDir, "verify-recommendations.ts")}`,
      {
        stdio: "inherit",
      },
    );
    recommendationsPass = true;
  } catch (err) {
    console.error("verify-recommendations.ts failed.");
  }

  // 3. History Verification
  try {
    console.log("\n--> Running verify-history.ts");
    execSync(`${runner} ${path.join(scriptsDir, "verify-history.ts")}`, {
      stdio: "inherit",
    });
    historyPass = true;
  } catch (err) {
    console.error("verify-history.ts failed.");
  }

  // 4. Dashboard Insights Verification
  try {
    console.log("\n--> Running verify-dashboard-insights.ts");
    execSync(
      `${runner} ${path.join(scriptsDir, "verify-dashboard-insights.ts")}`,
      {
        stdio: "inherit",
      },
    );
    insightsPass = true;
  } catch (err) {
    console.error("verify-dashboard-insights.ts failed.");
  }

  // Report Consolidated Matrix
  console.log("\n==========================================");
  console.log(`Results: ${resultsPass ? "PASS" : "FAIL"}`);
  console.log(`Recommendations: ${recommendationsPass ? "PASS" : "FAIL"}`);
  console.log(`History: ${historyPass ? "PASS" : "FAIL"}`);
  console.log(`Insights: ${insightsPass ? "PASS" : "FAIL"}`);

  const allPass =
    resultsPass && recommendationsPass && historyPass && insightsPass;
  console.log(`OVERALL: ${allPass ? "PASS" : "FAIL"}`);
  console.log("==========================================\n");

  if (allPass) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runMasterVerification();
