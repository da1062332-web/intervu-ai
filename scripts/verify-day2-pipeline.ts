import {
  connectPrisma,
  disconnectPrisma,
  prisma,
} from "../packages/database/src";
import {
  PRNG,
  generateVariables,
  evaluateConstraints,
  hydrateString,
  generateDistractors,
  evaluateExpression,
  roundToPrecision,
} from "@intervu-ai/generation";
import crypto from "crypto";

async function run() {
  console.log("==========================================");
  console.log("Starting Day 2 Pipeline Verification (100 Runs)");
  console.log("==========================================\n");

  await connectPrisma();

  // 1. Create a template using the new schema format
  console.log("Seeding test Template...");
  const template = await prisma.template.create({
    data: {
      name: "Day 2 Pipeline Test Template",
      templateKey: `test_pipeline_${Date.now()}`,
      conceptKey: "nodejs_event_loop",
      difficultyLevel: "MEDIUM",
      questionType: "mcq",
      variableSchema: {
        variables: [
          { name: "oldPrice", type: "integer", min: 100, max: 200 },
          { name: "margin", type: "integer", min: 10, max: 50 },
          { name: "newPrice", type: "formula", formula: "oldPrice + margin" },
          { name: "currency", type: "static", value: "USD" },
          { name: "isActive", type: "boolean" },
        ],
      },
      constraints: {
        constraints: [
          { rule: "newPrice > oldPrice", severity: "critical" },
          { rule: "newPrice Range 110-250", severity: "critical" },
        ],
      },
      structure: {
        questionTemplate:
          "A product price increased from {{oldPrice}} to {{newPrice}} {{currency}}.",
        optionsTemplate: ["{{oldPrice}}", "{{newPrice}}", "99", "120"],
      },
      solutionSchema: {
        formula: "newPrice",
        explanationTemplate:
          "The new price is computed as {{oldPrice}} + {{margin}} = {{newPrice}}.",
      },
    },
  });
  console.log(`Template created with ID: ${template.id}\n`);

  let successCount = 0;
  const totalRuns = 100;

  for (let i = 1; i <= totalRuns; i++) {
    process.stdout.write(`Generating question ${i}/${totalRuns}... `);
    try {
      // Execute the generation pipeline logic
      const variablesDef = (template.variableSchema as any).variables;
      const constraintsDef = (template.constraints as any).constraints;
      const structure = template.structure as any;
      const solutionSchema = template.solutionSchema as any;

      const prngSeed = Math.floor(Math.random() * 1000000);
      const prng = new PRNG(prngSeed);

      // 1. Generate Variables
      const vars = generateVariables(variablesDef, prng);

      // 2. Validate Constraints
      const constraintCheck = evaluateConstraints(constraintsDef, vars);
      if (!constraintCheck.isValid) {
        throw new Error("Constraint evaluation failed.");
      }

      // 3. Render Question
      const qText = hydrateString(structure.questionTemplate, vars);

      // 4. Render Options
      const options = structure.optionsTemplate.map((opt: string) =>
        hydrateString(opt, vars),
      );

      // 5. Render Answer & Explanation
      let ans = "";
      if (solutionSchema.formula) {
        ans = String(evaluateExpression(solutionSchema.formula, vars));
      } else {
        ans = options[0];
      }
      const explanation = hydrateString(
        solutionSchema.explanationTemplate,
        vars,
      );

      // 6. Check unresolved placeholders
      const hasUnresolved = (text: string) =>
        /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/.test(text) || /\{([^}]+)\}/.test(text);
      if (
        hasUnresolved(qText) ||
        hasUnresolved(explanation) ||
        options.some(hasUnresolved)
      ) {
        throw new Error("Rendered question contains unresolved placeholders.");
      }

      // 7. Check constraints manually
      const oldPrice = Number(vars.oldPrice);
      const newPrice = Number(vars.newPrice);
      const margin = Number(vars.margin);

      if (newPrice !== oldPrice + margin) {
        throw new Error("Formula resolution failed.");
      }
      if (newPrice <= oldPrice) {
        throw new Error("Constraint 'newPrice > oldPrice' violated.");
      }
      if (newPrice < 110 || newPrice > 250) {
        throw new Error("Constraint 'newPrice Range 110-250' violated.");
      }

      // 8. Verify answer in options
      if (!options.includes(ans)) {
        throw new Error("Answer not present in options.");
      }

      // 8b. Verify boolean variable type
      if (typeof vars.isActive !== "boolean") {
        throw new Error("Boolean variable generator failed.");
      }

      // 9. Uniqueness check & persistence
      const questionHash = crypto
        .createHash("sha256")
        .update(`${template.id}_${qText}_${options.join(",")}_${ans}`)
        .digest("hex");

      const existing = await prisma.generatedQuestion.findUnique({
        where: { questionHash },
      });
      if (existing) {
        throw new Error("Duplicate question hash detected.");
      }

      await prisma.generatedQuestion.create({
        data: {
          templateId: template.id,
          questionHash,
          conceptKey: template.conceptKey,
          difficultyLevel: template.difficultyLevel,
          questionType: template.questionType,
          questionText: qText,
          options,
          correctAnswer: ans,
          solution: explanation,
          metadata: vars,
        },
      });

      console.log("PASS");
      successCount++;
    } catch (err: any) {
      console.log(`FAIL: ${err.message}`);
    }
  }

  // Clean up
  console.log("\nCleaning up test data...");
  await prisma.generatedQuestion.deleteMany({
    where: { templateId: template.id },
  });
  await prisma.template.delete({
    where: { id: template.id },
  });
  console.log("Cleanup complete.");

  await disconnectPrisma();

  console.log("\n====================");
  console.log(
    `Successfully generated and verified ${successCount}/${totalRuns} questions.`,
  );
  console.log("====================");

  if (successCount === totalRuns) {
    console.log("Master Verification: PASS");
    process.exit(0);
  } else {
    console.log("Master Verification: FAIL");
    process.exit(1);
  }
}

run().catch((e) => {
  console.error("Fatal Error during verification:", e);
  process.exit(1);
});
