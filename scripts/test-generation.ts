import { GenerationService } from "../packages/ai-core/src/generation/generation.service";
import { connectPrisma, disconnectPrisma } from "../packages/database/src";

async function run() {
  console.log("Initializing Test Generation Harness...");
  await connectPrisma();

  try {
    const service = new GenerationService();
    const result = await service.generateQuestion(
      {
        conceptKey: "percentages",
        difficultyLevel: "medium",
        questionType: "mcq",
      },
      "test_seed_101",
    );

    console.log("\n--- GENERATED QUESTION DTO OUTPUT ---");
    console.log(JSON.stringify(result.question, null, 2));

    console.log("\n--- VALIDATION DTO OUTPUT ---");
    console.log(JSON.stringify(result.validation, null, 2));
    
  } catch (error: any) {
    console.error("Generation failed:", error);
  } finally {
    await disconnectPrisma();
  }
}

run();
