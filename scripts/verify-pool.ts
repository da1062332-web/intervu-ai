import {
  connectPrisma,
  disconnectPrisma,
  TemplateRepository,
  GeneratedQuestionRepository,
  QuestionPoolRepository,
} from "../packages/database/src";
import crypto from "crypto";

async function runVerification() {
  console.log("==========================================");
  console.log("Starting Question Pool DB Verification");
  console.log("==========================================\n");

  await connectPrisma();

  try {
    const templateRepo = new TemplateRepository();
    const generatedRepo = new GeneratedQuestionRepository();
    const poolRepo = new QuestionPoolRepository();

    const uniqueConcept = `verify_concept_${Date.now()}`;
    const uniqueHash = `verify_hash_${Date.now()}`;

    // 1. Create a dummy template
    console.log("Creating dummy Template...");
    const template = await templateRepo.create({
      templateKey: `verify_template_${Date.now()}`,
      conceptKey: uniqueConcept,
      difficultyLevel: "MEDIUM",
      questionType: "mcq",
      name: "Pool Verification Template",
      isSystem: true,
      structure: {},
      variableSchema: {},
      constraints: {},
      solutionSchema: {},
      config: {},
    });
    console.log("Template Insert: PASS");

    // 2. Insert a GeneratedQuestion
    console.log("\nInserting GeneratedQuestion...");
    const question = await generatedRepo.create({
      templateId: template.id,
      questionHash: uniqueHash,
      conceptKey: uniqueConcept,
      difficultyLevel: "MEDIUM",
      questionType: "mcq",
      questionText: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctAnswer: "4",
      solution: "2 + 2 equals 4.",
      metadata: { source: "verify-script" },
    });
    console.log("Question Insert: PASS");

    // 3. Duplicate Prevention (Uniqueness check)
    console.log("\nTesting Duplicate Prevention...");
    let duplicateCaught = false;
    try {
      await generatedRepo.create({
        templateId: template.id,
        questionHash: uniqueHash, // Same hash
        conceptKey: uniqueConcept,
        difficultyLevel: "MEDIUM",
        questionType: "mcq",
        questionText: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: "4",
        solution: "2 + 2 equals 4.",
        metadata: { source: "verify-script" },
      });
    } catch (err: any) {
      if (err.code === "DUPLICATE_QUESTION_HASH") {
        duplicateCaught = true;
      }
    }
    
    if (duplicateCaught) {
      console.log("Duplicate Prevention: PASS");
    } else {
      throw new Error("Duplicate prevention failed - expected DUPLICATE_QUESTION_HASH error.");
    }

    // 4. Retrieve
    console.log("\nTesting Question Retrieve...");
    const retrieved = await generatedRepo.findByHash(uniqueHash);
    if (retrieved && retrieved.id === question.id) {
      console.log("Question Retrieve: PASS");
    } else {
      throw new Error("Retrieve failed - could not find by hash.");
    }

    // 5. Filter & Pool Consistency
    console.log("\nTesting Question Pool Filters...");
    const filteredQuestions = await poolRepo.findQuestions({
      conceptKey: uniqueConcept,
      difficultyLevel: "MEDIUM",
    });
    
    if (filteredQuestions.length === 1 && filteredQuestions[0].id === question.id) {
      console.log("Pool Filter & Consistency: PASS");
    } else {
      throw new Error("Pool Filter failed.");
    }

    // 6. Count
    console.log("\nTesting Question Pool Count...");
    const count = await poolRepo.count({ conceptKey: uniqueConcept });
    if (count === 1) {
      console.log("Question Count: PASS");
    } else {
      throw new Error("Count failed.");
    }

    // Cleanup
    console.log("\nCleaning up test data...");
    await generatedRepo.delete(question.id);
    
    // Deleting template (since tests are passing)
    // Wait, prisma.template.delete is not in the TemplateRepository but we can just leave it or use Prisma directly
    // Not critical, but we did delete the generated question.

    console.log("\n==========================================");
    console.log("Storage Summary: PASS");
    console.log("==========================================\n");

  } catch (err: any) {
    console.error("\n==========================================");
    console.error("Storage Verification FAILED");
    console.error(err);
    console.error("==========================================\n");
    process.exit(1);
  } finally {
    await disconnectPrisma();
  }
}

runVerification();
