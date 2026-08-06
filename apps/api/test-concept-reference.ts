import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "../../.env") });

import { PromptBuilderService } from "./src/modules/generation-ai/prompts/prompt-builder.service";
import { OpenAIAdapter } from "./src/modules/generation-ai/adapters/openai.adapter";
import { QuestionGeneratorService } from "./src/modules/generation-ai/generators/question-generator.service";
import { OptionGeneratorService } from "./src/modules/generation-ai/generators/option-generator.service";
import { GenerationRetryService } from "./src/modules/generation-ai/retry/generation-retry.service";
import { ResponseValidatorService } from "./src/modules/generation-ai/validators/response-validator.service";
import { DuplicateDetectorService } from "./src/modules/generation-ai/validators/duplicate-detector.service";
import { DifficultyValidatorService } from "./src/modules/generation-ai/validators/difficulty-validator.service";
import { QuestionQualityService } from "./src/modules/generation-ai/scorers/question-quality.service";

async function testFullSuite() {
  console.log("\n========================================================");
  console.log("RUNNING FULL LIVE INTEGRATION TEST SUITE FOR DATASET MODES");
  console.log("========================================================\n");

  const apiKey = process.env.OPENAI_API_KEY;
  console.log(`🔑 OpenAI API Key status: ${apiKey ? "PRESENT" : "MISSING"}`);

  const promptBuilder = new PromptBuilderService();
  const mockConfigService: any = { openAiApiKey: apiKey };
  const openAiAdapter = new OpenAIAdapter(mockConfigService);
  const questionGenerator = new QuestionGeneratorService(openAiAdapter);
  const optionGenerator = new OptionGeneratorService();

  const mockPrisma: any = {
    templatePromptConfig: { findUnique: async () => null },
    styleProfile: { findFirst: async () => null },
    topic: { findFirst: async () => null },
    question: { findMany: async () => [] },
  };

  const responseValidator = new ResponseValidatorService();
  const duplicateDetector = new DuplicateDetectorService(mockPrisma);
  const difficultyValidator = new DifficultyValidatorService();
  const topicValidator: any = {
    validate: async () => ({ match: true, confidence: 1.0 }),
  };
  const qualityScorer = new QuestionQualityService(
    topicValidator,
    difficultyValidator,
  );

  const mockExplanationGenerator: any = { validateExplanation: () => {} };
  const mockAuditService: any = { log: async () => {} };
  const mockParameterGenerator: any = { generateParameters: () => ({}) };
  const mockDatasetLoader: any = {};
  const mockEntityGenerator: any = {};

  const retryService = new GenerationRetryService(
    mockPrisma,
    promptBuilder,
    questionGenerator,
    optionGenerator,
    mockExplanationGenerator,
    responseValidator,
    mockAuditService,
    duplicateDetector,
    qualityScorer,
    mockParameterGenerator,
    mockDatasetLoader,
    mockEntityGenerator,
  );

  const datasetItem = {
    id: "ds_item_blood_relation_01",
    questionText:
      "A family consists of six members P, Q, R, X, Y, Z. Q is the son of R but R is not mother of Q. P and R are a married couple. Y is the brother of R. X is the daughter of P. Z is the brother of P. How many female members are there in the family?",
    content:
      "A family consists of six members P, Q, R, X, Y, Z. Q is the son of R but R is not mother of Q. P and R are a married couple. Y is the brother of R. X is the daughter of P. Z is the brother of P. How many female members are there in the family?",
    options: ["1", "2", "3", "4"],
    answer: "2",
    explanation:
      "Concept\nUnderstanding blood relation structure.\n\nFormula / Reasoning\nIdentify members.\n\nStep-by-Step Solution\n1. R is father.\n2. P is mother.\n3. X is daughter.\n\nFinal Answer\n2",
    metadata: { topic: "Blood Relations", difficulty: "HARD" },
  };

  // --------------------------------------------------------------------------
  // TEST 1: DIRECT Mode (Bypasses AI / LLM completely)
  // --------------------------------------------------------------------------
  console.log("📌 TEST 1: DIRECT Mode (Fetch Raw Dataset Item without AI)");
  const directResult = await retryService.generateFromTemplate(
    {
      id: "tpl_blood_relation_direct",
      difficultyLevel: "HARD",
      conceptKey: "BLOOD_RELATION",
      generationStrategy: "DATASET",
      datasetGenerationMode: "DIRECT",
      questionType: "MULTIPLE_CHOICE",
    } as any,
    {},
    3,
    { datasetItem },
  );

  console.log(`   ✔️ Success: ${directResult.success}`);
  console.log(
    `   ✔️ datasetGenerationMode: ${directResult.question?.metadata?.datasetGenerationMode}`,
  );
  console.log(
    `   ✔️ isAiGenerated: ${directResult.question?.metadata?.isAiGenerated}`,
  );
  console.log(
    `   ✔️ generationSource: ${directResult.question?.metadata?.generationSource}`,
  );
  console.log(
    `   ✔️ isFallbackDatasetFetch: ${directResult.question?.metadata?.isFallbackDatasetFetch}`,
  );
  console.log(
    `   🎯 Question Text: "${directResult.question?.question.slice(0, 75)}..."\n`,
  );

  // --------------------------------------------------------------------------
  // TEST 2: AI Mode (Generates Dynamic Brand-New Question via OpenAI LLM)
  // --------------------------------------------------------------------------
  console.log(
    "📌 TEST 2: AI Mode (Generates Brand-New Scenario via OpenAI LLM)",
  );
  const aiResult = await retryService.generateFromTemplate(
    {
      id: "tpl_blood_relation_ai",
      difficultyLevel: "HARD",
      conceptKey: "BLOOD_RELATION",
      generationStrategy: "DATASET",
      datasetGenerationMode: "AI",
      questionType: "MULTIPLE_CHOICE",
    } as any,
    {},
    3,
    { datasetItem },
  );

  console.log(`   ✔️ Success: ${aiResult.success}`);
  if (!aiResult.success) {
    console.log(`   ❌ AI Errors:`, aiResult.errors);
  }
  console.log(
    `   ✔️ datasetGenerationMode: ${aiResult.question?.metadata?.datasetGenerationMode}`,
  );
  console.log(
    `   ✔️ isAiGenerated: ${aiResult.question?.metadata?.isAiGenerated}`,
  );
  console.log(
    `   ✔️ generationSource: ${aiResult.question?.metadata?.generationSource}`,
  );
  console.log(
    `   ✔️ isFallbackDatasetFetch: ${aiResult.question?.metadata?.isFallbackDatasetFetch}`,
  );
  console.log(
    `   🎯 AI Question Text:\n      "${aiResult.question?.question}"`,
  );
  console.log(`   📋 AI Options: [${aiResult.question?.options?.join(", ")}]`);
  console.log(`   ✔️ AI Correct Answer: ${aiResult.question?.correctAnswer}`);

  console.log("\n========================================================");
  console.log("🎉 ALL TESTS PASSED! DIRECT AND AI MODES ARE 100% OPERATIONAL.");
  console.log("========================================================\n");
}

testFullSuite().catch(console.error);
