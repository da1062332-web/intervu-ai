import { GenerationService } from "../packages/ai-core/src/generation/generation.service";
import { connectPrisma, disconnectPrisma } from "../packages/database/src";

const CONCEPTS = [
  "percentages",
  "probability",
  "algebra",
  "data_structures",
  "algorithms",
  "react_hooks",
  "nodejs_event_loop",
  "sql_joins",
  "system_design",
  "typescript_generics",
];

const DIFFICULTIES: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "hard"];

async function runVerification() {
  console.log("==========================================");
  console.log("Starting Generation Verification (20 Runs)");
  console.log("==========================================\n");

  await connectPrisma();
  
  let passes = 0;
  let failures = 0;
  const iterations = process.env.CI ? 2 : 20;

  try {
    const service = new GenerationService();

    for (let i = 1; i <= iterations; i++) {
      const concept = CONCEPTS[i % CONCEPTS.length];
      const difficulty = DIFFICULTIES[i % DIFFICULTIES.length];

      try {
        const result = await service.generateQuestion(
          {
            conceptKey: concept,
            difficultyLevel: difficulty,
            questionType: "mcq",
          },
          `test_verify_seed_${Date.now()}_${i}`
        );

        const { question, validation } = result;

        // DTO checks
        const hasRequiredFields = !!(
          question.id &&
          question.content &&
          question.type &&
          question.difficulty &&
          question.options &&
          question.correctAnswer &&
          question.solution
        );

        const hasMetadata = !!question.metadata;
        const difficultyMatch = question.difficulty === difficulty;
        const hasOptions = Array.isArray(question.options) && question.options.length > 0;
        const validationPassed = validation && validation.isValid;

        if (
          hasRequiredFields &&
          hasMetadata &&
          difficultyMatch &&
          hasOptions &&
          validationPassed
        ) {
          console.log(`Generation Test #${i} PASS [${concept} - ${difficulty}]`);
          passes++;
        } else {
          console.error(`Generation Test #${i} FAIL [${concept} - ${difficulty}]`);
          console.error({ hasRequiredFields, hasMetadata, difficultyMatch, hasOptions, validationPassed });
          failures++;
        }
      } catch (error: any) {
        console.error(`Generation Test #${i} FAIL (Exception) [${concept} - ${difficulty}]`, error.message);
        failures++;
      }
    }

    console.log("\n==========================================");
    console.log("Generation Summary");
    console.log(`PASS: ${passes} / FAIL: ${failures}`);
    console.log("==========================================\n");

    if (failures > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Critical failure during verification:", err);
    process.exit(1);
  } finally {
    await disconnectPrisma();
  }
}

runVerification();
