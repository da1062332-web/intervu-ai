import {
  connectPrisma,
  disconnectPrisma,
  prisma,
} from "../packages/database/src";
import { TemplateService } from "../apps/api/src/modules/template-library/services/template.service";
import { QuestionsController } from "../apps/api/src/modules/question-bank/controllers/questions.controller";
import { QuestionRepository } from "../apps/api/src/modules/question-bank/repositories/question.repository";
import { TemplateRepository } from "../apps/api/src/modules/template-library/repositories/template.repository";
import { TemplateVariableRepository } from "../apps/api/src/modules/template-library/repositories/template-variable.repository";
import { TemplateRuleRepository } from "../apps/api/src/modules/template-library/repositories/template-rule.repository";

async function run() {
  console.log("==========================================");
  console.log("Starting Day 3 Lifecycle E2E Verification");
  console.log("==========================================\n");

  await connectPrisma();

  // 1. Seeding mock template
  console.log("Seeding test Template...");
  const template = await prisma.template.create({
    data: {
      name: "Day 3 Lifecycle Test Template",
      templateKey: `test_lifecycle_${Date.now()}`,
      conceptKey: "nodejs_event_loop",
      difficultyLevel: "MEDIUM",
      questionType: "mcq",
      variableSchema: {
        variables: [
          { name: "oldPrice", type: "integer", min: 100, max: 200 },
          { name: "margin", type: "integer", min: 10, max: 50 },
          { name: "newPrice", type: "formula", formula: "oldPrice + margin" },
          { name: "currency", type: "static", value: "USD" },
        ],
      },
      constraints: {
        constraints: [{ rule: "newPrice > oldPrice", severity: "critical" }],
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
  console.log(`Template created: ${template.id}\n`);

  // Instantiating services manually
  const templateRepo = new TemplateRepository(prisma as any);
  const templateVarRepo = new TemplateVariableRepository(prisma as any);
  const templateRuleRepo = new TemplateRuleRepository(prisma as any);
  const templateService = new TemplateService(
    prisma as any,
    templateRepo,
    templateVarRepo,
    templateRuleRepo,
    null,
  );
  const controller = new QuestionsController(
    null,
    prisma as any,
    templateService,
    undefined,
  );

  // 2. Test Batch Generation (Task Group 1)
  console.log("1. Testing Batch Generation (10 Questions)...");
  try {
    const single = await templateService.generateQuestionForTemplate(
      template.id,
    );
    console.log("Single generation succeeded:", single.question.id);
  } catch (err: any) {
    console.error("Single generation failed with error:", err);
  }
  const batchResult = await templateService.generateBatchForTemplate(
    template.id,
    10,
    true,
  );
  console.log(
    `Batch Result: Generated: ${batchResult.generated}, Failed: ${batchResult.failed}`,
  );
  if (batchResult.generated !== 10) {
    throw new Error(
      `Batch generation failed. Expected 10 questions, got ${batchResult.generated}`,
    );
  }
  const qIds = batchResult.questionIds;

  // 3. Test Question Search and Filtering (Task Group 2 & 7)
  console.log("\n2. Testing Search and Filtering API...");
  const searchResult = await controller.search(
    undefined,
    undefined,
    undefined,
    undefined,
    "nodejs_event_loop",
    template.id,
    "MEDIUM",
    "GENERATED",
  );
  console.log(`Search Result Count: ${searchResult.data.length}`);
  if (searchResult.data.length === 0) {
    throw new Error("Search API failed to retrieve generated questions.");
  }

  // 4. Test Approval (Task Group 3)
  console.log("\n3. Testing Approve API...");
  const qToApproveId = qIds[0];
  const approveResult = await controller.approveQuestion(qToApproveId);
  console.log(`Approval Result Status: ${approveResult.status}`);
  if (approveResult.status !== "APPROVED") {
    throw new Error("Approval action failed.");
  }

  // Verify approval state
  const approvedQuestion = await prisma.generatedQuestion.findUnique({
    where: { id: qToApproveId },
  });
  if ((approvedQuestion?.metadata as any)?.status !== "APPROVED") {
    throw new Error(
      "Approved status was not correctly persisted in metadata JSON.",
    );
  }

  // 5. Test Reject (Task Group 3)
  console.log("\n4. Testing Reject API...");
  const qToRejectId = qIds[1];
  const rejectResult = await controller.rejectQuestion(qToRejectId);
  console.log(`Rejection Result Status: ${rejectResult.status}`);
  if (rejectResult.status !== "REJECTED") {
    throw new Error("Rejection action failed.");
  }

  // 6. Test Publish (Task Group 3)
  console.log("\n5. Testing Publish API...");
  const publishResult = await controller.publishQuestion(qToApproveId);
  console.log(
    `Publish Result Status: ${publishResult.status}, Main Question ID: ${publishResult.mainQuestionId}`,
  );
  if (publishResult.status !== "PUBLISHED") {
    throw new Error("Publish action failed.");
  }

  // Verify it exists in main Question table
  const mainQuestion = await prisma.question.findUnique({
    where: { id: publishResult.mainQuestionId },
  });
  if (
    !mainQuestion ||
    mainQuestion.questionText !== approvedQuestion?.questionText
  ) {
    throw new Error(
      "Published question not found or content mismatch in main Question pool.",
    );
  }

  // 7. Test Editing (Task Group 5)
  console.log("\n6. Testing Edit (PATCH) API...");
  const qToEditId = qIds[2];
  const editResult = await controller.editQuestion(qToEditId, {
    questionText: "Edited Question Text?",
    options: ["Option A", "Option B", "Option C"],
    correctAnswer: "Option A",
    explanation: "Edited Explanation text.",
  });
  console.log(`Edit Result: ${editResult.success ? "SUCCESS" : "FAIL"}`);
  if (editResult.data.questionText !== "Edited Question Text?") {
    throw new Error("Editing failed to persist questionText.");
  }

  // 8. Test Regeneration (Task Group 4)
  console.log("\n7. Testing Regeneration API...");
  const regenResult = await controller.regenerateQuestion(qToRejectId);
  console.log(
    `Regeneration Result: Status: ${regenResult.data.status}, Version: ${regenResult.data.version}`,
  );
  if (regenResult.data.version !== 2) {
    throw new Error("Regeneration versioning failed.");
  }

  // Verify previous version snapshot
  const regeneratedQuestion = await prisma.generatedQuestion.findUnique({
    where: { id: qToRejectId },
  });
  const history = (regeneratedQuestion?.metadata as any)?.previousVersions;
  if (!history || history.length === 0 || history[0].version !== 1) {
    throw new Error(
      "History snapshot lineage not found for regenerated question.",
    );
  }

  // 9. Test Statistics API (Task Group 8)
  console.log("\n8. Testing Statistics API...");
  const stats = await controller.getStatistics();
  console.log(
    `Stats: Generated: ${stats.generated}, Approved: ${stats.approved}, Published: ${stats.published}, Rejected: ${stats.rejected}`,
  );
  if (stats.published === 0) {
    throw new Error("Statistics API failed to track published questions.");
  }

  // 10. Test Deleting (Task Group 2)
  console.log("\n9. Testing Delete API...");
  const qToDeleteId = qIds[3];
  const deleteResult = await controller.deleteQuestion(qToDeleteId);
  console.log(`Delete Result message: ${deleteResult.message}`);
  const deletedQ = await prisma.generatedQuestion.findUnique({
    where: { id: qToDeleteId },
  });
  if (deletedQ) {
    throw new Error("Delete API failed to remove generated question record.");
  }

  // Clean up
  console.log("\nCleaning up test data...");
  // Clear main questions copied
  await prisma.question.deleteMany({
    where: { templateId: template.id },
  });
  // Clear generated questions pool
  await prisma.generatedQuestion.deleteMany({
    where: { templateId: template.id },
  });
  await prisma.template.delete({
    where: { id: template.id },
  });
  console.log("Cleanup complete.");

  await disconnectPrisma();
  console.log("\n====================");
  console.log("All Lifecycle E2E Tests: PASS");
  console.log("====================");
  process.exit(0);
}

run().catch((e) => {
  console.error("Fatal Error during E2E verification:", e);
  process.exit(1);
});
