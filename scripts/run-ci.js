const { execSync } = require("child_process");

const commands = [
  "npm run check:structure",
  "npm run lint",
  "npm run type-check",
  "npm run test",
  "npm run verify:day2",
];

console.log("--- Starting CI Validation ---");

for (const cmd of commands) {
  console.log(`\n> Running: ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit", cwd: process.cwd() });
    console.log(`✅ ${cmd} completed successfully.`);
  } catch (err) {
    console.error(`❌ ${cmd} failed!`);
    process.exit(1);
  }
}

console.log("\n✅ All validations passed. Ready to push!");
