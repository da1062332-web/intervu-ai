import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Module } from "@nestjs/common";
import { PrismaModule } from "../apps/api/src/prisma/prisma.module";
import { GenerationAiModule } from "../apps/api/src/modules/generation-ai/generation-ai.module";
import { GenerationRetryService } from "../apps/api/src/modules/generation-ai/retry/generation-retry.service";
import { RedisConnectionManager } from "../apps/api/src/cache";
import { AppConfigService } from "../apps/api/src/config";

@Module({
  imports: [PrismaModule, GenerationAiModule],
})
class TestModule {}

async function run() {
  console.log(
    "Initializing Standalone NestJS Module for Generation-AI Verification...",
  );

  // Set NODE_ENV to test to force MockAdapter usage
  process.env.NODE_ENV = "test";

  const app = await NestFactory.createApplicationContext(TestModule, {
    logger: ["error", "warn"],
  });

  const configService = app.get(AppConfigService);
  try {
    await RedisConnectionManager.connect(configService.redisUrl);
  } catch (e) {
    // Redis offline warning ignored for standalone CLI test
  }

  const retryService = app.get(GenerationRetryService);

  console.log("\n🧪 Running AI Question Generation & Validation pipeline...");
  console.log(
    "Inputs: category = 'quantitative', topic = 'Percentages', difficulty = 'Medium'\n",
  );

  const start = Date.now();
  const result = await retryService.generateWithRetry(
    "quantitative",
    "Percentages",
    "Medium",
  );
  const duration = Date.now() - start;

  console.log("--------------------------------------------------");
  console.log(`⏱️ Completed in ${duration}ms`);
  console.log(`✅ Success: ${result.success}`);
  console.log(`🔄 Attempts: ${result.attempts}`);

  if (result.success && result.question) {
    console.log("\n📝 Generated & Validated Question:");
    console.log(JSON.stringify(result.question, null, 2));
  } else {
    console.log("\n❌ Failure Errors:");
    console.log(result.errors);
  }
  console.log("--------------------------------------------------");

  await app.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
