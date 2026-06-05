const fs = require("fs");
const path = require("path");

const requiredDirs = ["apps", "packages", "docs"];
const root = path.resolve(__dirname, "..");

let missing = false;

for (const dir of requiredDirs) {
  if (!fs.existsSync(path.join(root, dir))) {
    console.error(`❌ Missing required directory: ${dir}`);
    missing = true;
  }
}

if (missing) {
  console.error("Check failed: Required repository structure is missing.");
  process.exit(1);
}

console.log("✅ Structure check passed.");
