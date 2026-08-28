import fetch from "node-fetch";

const JUDGE0_URL = "https://marbled-fifty-unraveled.ngrok-free.dev";

async function getLanguages() {
  const res = await fetch(`${JUDGE0_URL}/languages`, {
    headers: {
      "ngrok-skip-browser-warning": "true"
    }
  });
  const langs: any = await res.json();
  console.log("Supported Judge0 Languages:");
  for (const l of langs) {
    if (l.name.toLowerCase().includes("java") || l.name.toLowerCase().includes("python") || l.name.toLowerCase().includes("c++") || l.name.toLowerCase().includes("script")) {
      console.log(`  ID: ${l.id} | Name: ${l.name}`);
    }
  }
}

getLanguages().catch(console.error);
