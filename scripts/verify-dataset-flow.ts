import { PrismaClient } from "@prisma/client";
import { DatasetService } from "../apps/api/src/modules/dataset/services/dataset.service";
import { TemplateDatasetService } from "../apps/api/src/modules/template-library/services/template-dataset.service";
import { TemplateRepository } from "../apps/api/src/modules/template-library/repositories/template.repository";
import { TemplateDatasetRepository } from "../apps/api/src/modules/template-library/repositories/template-dataset.repository";

// Active question-generation classes
import { GenerationStrategyResolver } from "../apps/api/src/modules/question-generation/services/generation-strategy-resolver.service";
import { StrategyRegistry } from "../apps/api/src/modules/question-generation/registry/strategy.registry";
import { DatasetGenerationStrategy } from "../apps/api/src/modules/question-generation/strategies/dataset/dataset-generation.strategy";
import { PromptBuilderService } from "../apps/api/src/modules/question-generation/prompt/prompt-builder.service";
import { PromptTemplateRegistry } from "../apps/api/src/modules/question-generation/registry/prompt-template.registry";
import { QuestionAssemblerService } from "../apps/api/src/modules/question-generation/assembler/question-assembler.service";

import { TemplateDatasetConfigResponseSchema } from "../packages/shared/src/schemas/template-configs.schema";

const prisma = new PrismaClient();

async function runVerification() {
  console.log("🚀 Starting End-to-End Dataset Flow Verification (question-generation)...");

  const templateId = "cmrpv0ibr0007jmbvmt775ff6";
  const datasetId = "cmrdb07ma005x94gqjnydv8em";
  const specificItemId = "cmrdb08ta005z94gqwcf53xof";

  // Repositories and Services
  const templateRepo = new TemplateRepository(prisma);
  const templateDatasetRepo = new TemplateDatasetRepository(prisma);
  const templateDatasetService = new TemplateDatasetService(templateDatasetRepo, templateRepo);
  const datasetService = new DatasetService(prisma);

  // Setup strategies registry and resolver
  const strategyRegistry = new StrategyRegistry();
  const datasetStrategy = new DatasetGenerationStrategy(prisma);
  strategyRegistry.register("DATASET", datasetStrategy);
  const strategyResolver = new GenerationStrategyResolver(prisma, strategyRegistry);

  // Setup prompt registry and builder
  const promptTemplateRegistry = new PromptTemplateRegistry();
  promptTemplateRegistry.register("DATASET", "Generate question based on {{passage}} testing topic {{topic}} and company {{company_name}} and role {{role}}");
  const promptBuilder = new PromptBuilderService(promptTemplateRegistry);

  const assembler = new QuestionAssemblerService();

  // 1. Verify Dataset Schema Inference
  console.log("\n1. Testing Dataset Schema Inference...");
  const schema = await datasetService.getDatasetSchema(datasetId);
  console.log("✅ Dataset schema inferred successfully:", JSON.stringify(schema, null, 2));

  // 2. Verify Config Save and Zod Validation
  console.log("\n2. Saving template-dataset configuration mapping...");
  const mappingDto = {
    datasetId,
    selectionMethod: "SPECIFIC",
    allowReuse: false,
    shuffle: true,
    specificItemId,
    variableMapping: {
      "company_name": "companyName",
      "role": "jobTitle"
    },
    tags: []
  };

  const savedConfig = await templateDatasetService.saveDatasetConfig(templateId, mappingDto);
  console.log("✅ Configuration saved to DB.");

  // Run Zod validation interceptor check
  const valResult = TemplateDatasetConfigResponseSchema.safeParse(savedConfig);
  if (!valResult.success) {
    console.error("❌ Response Validation Failed:", JSON.stringify(valResult.error.errors, null, 2));
    throw new Error("Validation failed");
  }
  console.log("✅ Response payload validates against Zod contract schema successfully!");

  // 3. Verify Template-Dataset Relation Join
  console.log("\n3. Testing Template Repository relationship retrieval...");
  await prisma.template.update({
    where: { id: templateId },
    data: { generationStrategy: "DATASET" }
  });
  const template = await templateRepo.findById(templateId);
  if (!template || !(template as any).datasetConfigRelation) {
    console.error("❌ Template retrieval did not join datasetConfigRelation!");
    throw new Error("Relation join failed");
  }
  console.log("✅ Template retrieved and includes datasetConfigRelation successfully.");

  // 4. Verify Variable Selection Strategy Resolution
  console.log("\n4. Testing generation strategy resolution (Resolving variables)...");
  const context = await strategyResolver.resolve(templateId);
  console.log("✅ Strategy context resolved successfully:");
  console.log("- Selected Item Content:", (context.payload as any).passage);
  console.log("- Resolved Variables:", JSON.stringify(context.metadata.variables, null, 2));
  console.log("- Lineage Audit:", JSON.stringify(context.metadata.lineage, null, 2));

  // 5. Verify Prompt Variable Interpolation
  console.log("\n5. Testing prompt building and variable interpolation...");
  const rawQuestion = await promptBuilder.buildAndExecute(context);
  console.log("✅ Prompt compiled and LLM stub mock response received successfully.");

  // 6. Verify Question Assembly includes Lineage
  console.log("\n6. Testing Question Assembly and lineage preservation...");
  const assembled = assembler.assemble(context, rawQuestion, templateId);
  console.log("✅ Question assembled successfully.");
  console.log("- Assembled Metadata (showing lineage):", JSON.stringify(assembled.metadata, null, 2));

  if (!assembled.metadata.lineage) {
    console.error("❌ Assembled question is missing lineage auditing!");
    throw new Error("Lineage missing");
  }

  console.log("\n🎉 ALL CHECKS PASSED SUCCESSFULLY!");
}

runVerification()
  .catch((err) => {
    console.error("\n❌ Verification Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
