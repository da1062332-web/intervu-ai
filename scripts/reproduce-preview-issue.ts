import { PrismaClient } from "@prisma/client";
import { PromptBuilderService } from "../apps/api/src/modules/generation-ai/prompts/prompt-builder.service";

const prisma = new PrismaClient();

async function run() {
  console.log("🚀 Finding a template with prompt configuration...\n");

  const configs = await prisma.templatePromptConfig.findMany({
    include: { template: true },
    take: 1,
  });

  if (configs.length === 0) {
    console.log(
      "⚠️ No custom template prompt configurations found in the database. Let's create one for testing!",
    );
    // We can create a dummy one for our test template
    const templateId = "cmrpv0ibr0007jmbvmt775ff6";
    const created = await prisma.templatePromptConfig.upsert({
      where: { templateId },
      update: {
        systemPrompt:
          "CUSTOM SYSTEM PROMPT: You are a lexical assistant specialized in synonym validation.",
        userPrompt:
          "CUSTOM USER PROMPT: Validate the synonym {{synonym_placeholder}}.",
        instructions:
          "CUSTOM INSTRUCTIONS: Ensure the output matches the required JSON structure.",
      },
      create: {
        templateId,
        systemPrompt:
          "CUSTOM SYSTEM PROMPT: You are a lexical assistant specialized in synonym validation.",
        userPrompt:
          "CUSTOM USER PROMPT: Validate the synonym {{synonym_placeholder}}.",
        instructions:
          "CUSTOM INSTRUCTIONS: Ensure the output matches the required JSON structure.",
      },
    });
    console.log("✅ Created test custom prompt configuration record in DB!");
    configs.push({
      ...created,
      template: (await prisma.template.findUnique({
        where: { id: templateId },
      })) as any,
    });
  }

  const activeConfig = configs[0];
  const template = activeConfig.template;

  console.log(`📋 Active Template: ${template.name} (${template.id})`);
  console.log("📋 Stored database prompt configuration:");
  console.log(
    JSON.stringify(
      {
        systemPrompt: activeConfig.systemPrompt,
        userPrompt: activeConfig.userPrompt,
        instructions: activeConfig.instructions,
      },
      null,
      2,
    ),
  );
  console.log("\n");

  const promptBuilder = new PromptBuilderService();

  // 1. Build prompt WITHOUT passing promptConfig (as the current controller does)
  const mockInputWithoutConfig = {
    template: {
      ...template,
      generationStrategy: "DATASET",
    },
    variableValues: { synonym_placeholder: "abundant" },
    datasetItem: { content: "Reading passage about vocabulary words." },
    styleProfile: undefined,
  };

  const compiledPromptWithoutConfig = promptBuilder.buildPrompt(
    mockInputWithoutConfig as any,
  );
  console.log(
    "❌ Compiled Prompt (WITHOUT passing promptConfig - Current Buggy Controller):",
  );
  console.log(
    "--------------------------------------------------------------------------------",
  );
  console.log(compiledPromptWithoutConfig.split("\n\n")[0]); // Print system prompt part
  console.log(
    "--------------------------------------------------------------------------------\n",
  );

  // 2. Build prompt WITH passing promptConfig (the proposed fix)
  const mockInputWithConfig = {
    template: {
      ...template,
      generationStrategy: "DATASET",
    },
    variableValues: { synonym_placeholder: "abundant" },
    datasetItem: { content: "Reading passage about vocabulary words." },
    promptConfig: activeConfig || undefined,
    styleProfile: undefined,
  };

  const compiledPromptWithConfig = promptBuilder.buildPrompt(
    mockInputWithConfig as any,
  );
  console.log("✅ Compiled Prompt (WITH passing promptConfig - Proposed Fix):");
  console.log(
    "--------------------------------------------------------------------------------",
  );
  console.log(compiledPromptWithConfig.split("\n\n")[0]); // Print system prompt part
  console.log(
    "--------------------------------------------------------------------------------",
  );

  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
});
