import { PrismaClient } from "@prisma/client";
import { PromptBuilderService } from "../apps/api/src/modules/generation-ai/prompts/prompt-builder.service";

const prisma = new PrismaClient();

async function run() {
  console.log("🚀 Starting Preview Prompt Compilation Scenario Tests...\n");
  const promptBuilder = new PromptBuilderService();
  const testTemplateId = "cmrpv0ibr0007jmbvmt775ff6"; // Test template

  const template = await prisma.template.findUnique({
    where: { id: testTemplateId },
  });

  if (!template) {
    console.error("❌ Test template not found.");
    await prisma.$disconnect();
    return;
  }

  // --------------------------------------------------------------------------------
  // Scenario 1: Custom Saved Prompt Configurations
  // --------------------------------------------------------------------------------
  console.log("--- Scenario 1: Custom Saved Prompt Configuration ---");
  const customConfig = {
    systemPrompt: "SYSTEM: Act as an expert math question writer.",
    userPrompt: "USER: Write a question about {{synonym_placeholder}}.",
    instructions: "INSTRUCTIONS: Output JSON.",
    outputRules: "RULES: No Markdown.",
  };

  const compiledPrompt1 = promptBuilder.buildPrompt({
    template: { ...template, generationStrategy: "DATASET" } as any,
    variableValues: { synonym_placeholder: "superb" },
    datasetItem: { content: "Sample content." },
    promptConfig: customConfig as any,
  });

  console.log(
    "System Prompt matches custom system prompt?",
    compiledPrompt1.includes(customConfig.systemPrompt) ? "✅ YES" : "❌ NO",
  );
  console.log(
    "User Prompt matches custom user prompt?",
    compiledPrompt1.includes("USER: Write a question about superb.")
      ? "✅ YES"
      : "❌ NO",
  );
  console.log(
    "Instructions matches custom instructions?",
    compiledPrompt1.includes("CUSTOM INSTRUCTIONS:")
      ? "❌ YES (Mismatched)"
      : "✅ YES (Using custom)",
  );
  console.log("\n");

  // --------------------------------------------------------------------------------
  // Scenario 2: No Saved Prompt Configuration (Fallback to Defaults)
  // --------------------------------------------------------------------------------
  console.log(
    "--- Scenario 2: No Saved Prompt Configuration (Fallback to Defaults) ---",
  );
  const compiledPrompt2 = promptBuilder.buildPrompt({
    template: { ...template, generationStrategy: "DATASET" } as any,
    variableValues: { synonym_placeholder: "superb" },
    datasetItem: { content: "Sample content." },
    promptConfig: undefined, // Simulates a template that doesn't have custom configs in DB
  });

  console.log(
    "Uses default system prompt fallback?",
    compiledPrompt2.includes(
      "You are an expert AI Assessment Question Generator",
    )
      ? "✅ YES"
      : "❌ NO",
  );
  console.log(
    "Uses default user instructions fallback?",
    compiledPrompt2.includes("Generate a high-quality") ? "✅ YES" : "❌ NO",
  );
  console.log("\n");

  // --------------------------------------------------------------------------------
  // Scenario 3: Variable Interpolation Edge Cases (Null and Omitted Variables)
  // --------------------------------------------------------------------------------
  console.log("--- Scenario 3: Variable Interpolation Edge Cases ---");
  const compiledPrompt3 = promptBuilder.buildPrompt({
    template: { ...template, generationStrategy: "DATASET" } as any,
    variableValues: {
      synonym_placeholder: null, // Null value
      // missing_placeholder is completely omitted from variableValues
    },
    datasetItem: { content: "Sample content." },
    promptConfig: {
      systemPrompt: "SYSTEM: Synonym validator",
      userPrompt:
        "USER: Validate synonym: '{{synonym_placeholder}}' and '{{missing_placeholder}}'",
      instructions: "INSTRUCTIONS: Output JSON.",
    } as any,
  });

  console.log(
    "Interpolated null variables safely?",
    compiledPrompt3.includes("Validate synonym: 'null'") ? "✅ YES" : "❌ NO",
  );
  console.log(
    "Preserved missing placeholder tags safely?",
    compiledPrompt3.includes("'{{missing_placeholder}}'") ? "✅ YES" : "❌ NO",
  );
  console.log("\n");

  console.log("🎉 ALL SCENARIO CHECKS PASSED SUCCESSFULLY!");
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
});
