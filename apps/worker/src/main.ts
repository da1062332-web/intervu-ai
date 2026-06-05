import { createWorkerBootstrap } from "./bootstrap";

async function main() {
  const app = await createWorkerBootstrap();
  await app.initialize();
  console.log("Worker started successfully");
}

main().catch((error) => {
  console.error("Failed to start worker:", error);
  process.exit(1);
});
