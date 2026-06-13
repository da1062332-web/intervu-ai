import { execSync } from "child_process";

async function verifyApiStack() {
  console.log("Starting Master API Stack Verification...\n");

  try {
    execSync("npx ts-node scripts/verify-security.ts", { stdio: "inherit" });
    execSync("npx ts-node scripts/verify-rate-limits.ts", { stdio: "inherit" });
    execSync("npx ts-node scripts/verify-observability.ts", {
      stdio: "inherit",
    });
    execSync("npx ts-node scripts/verify-performance.ts", { stdio: "inherit" });

    console.log("\n=========================");
    console.log("Security PASS");
    console.log("Rate Limits PASS");
    console.log("Observability PASS");
    console.log("Performance PASS");
    console.log("OVERALL PASS");
    console.log("=========================");
  } catch {
    console.error("\n[ERROR] Verification pipeline failed.");
    process.exit(1);
  }
}

verifyApiStack();
