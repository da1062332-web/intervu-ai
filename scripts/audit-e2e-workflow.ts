import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../apps/api/.env") });

import { prisma } from "../packages/database/src";
import jwt from "jsonwebtoken";
import { DifficultyLevel } from "@prisma/client";

const API_URL = process.env.API_URL || "http://127.0.0.1:4000/api/v1";
const JWT_SECRET = process.env.JWT_SECRET || "replace-with-a-long-secret-at-least-32-chars";

async function run() {
  console.log("==================================================");
  console.log("Starting Full REST API Exam Workflow Audit");
  console.log("==================================================\n");

  // 1. Verify API server is running
  try {
    const healthCheck = await fetch(`${API_URL}/health`);
    if (healthCheck.status !== 200 && healthCheck.status !== 400) {
      throw new Error("Health check failed");
    }
    console.log("✅ API server is running and healthy.\n");
  } catch (e) {
    console.error(`❌ API is not running at ${API_URL}.`);
    console.error("Please run the backend (npm run dev) first before running this script.");
    process.exit(1);
  }

  const rand = Date.now();
  const testTopicCode = `audit_topic_${rand}`;
  const testConceptCode = `audit_concept_${rand}`;

  // Keep track of created objects for cleanup
  let topicId = "";
  let conceptId = "";
  let templateId = "";
  let examConfigId = "";
  let sectionId = "";
  let workflowId = "";

  try {
    // 2. Resolve Admin User
    console.log("Resolving Admin User...");
    let adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    });
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: `audit_admin_${rand}@test.com`,
          passwordHash: "dummyhash",
          fullName: "Audit Administrator",
          role: "ADMIN"
        }
      });
    }
    const adminId = adminUser.id;
    console.log(`Using Admin: ${adminUser.email} (${adminId})`);

    // 3. Generate Auth JWT Token
    const token = jwt.sign(
      {
        sub: adminId,
        email: adminUser.email,
        role: adminUser.role,
        type: "access",
        sessionId: "audit-session"
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    console.log("Generated Admin Authorization Token.\n");

    const authHeader = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };

    // 4. Setup Topic, Concept, and Template in database
    console.log("Creating Topic and Concept...");
    const topic = await prisma.topic.create({
      data: {
        code: testTopicCode,
        name: "E2E Audit Topic",
        description: "Topic created for testing the e2e exam generation audit flow",
        status: "ACTIVE"
      }
    });
    topicId = topic.id;

    const concept = await prisma.concept.create({
      data: {
        code: testConceptCode,
        name: "E2E Audit Concept",
        topicId: topic.id,
        description: "Concept created for audit validation",
        status: "ACTIVE"
      }
    });
    conceptId = concept.id;

    const template = await prisma.template.create({
      data: {
        name: "E2E Audit Question Template",
        templateKey: `audit_tpl_${rand}`,
        conceptKey: concept.code,
        difficultyLevel: DifficultyLevel.MEDIUM,
        questionType: "multiple_choice",
        structure: {
          questionTemplate: "A product is priced at {{price}} USD. The tax is {{tax}} USD. What is the total price?",
          optionsTemplate: ["{{C}}", "{{opt1}}", "{{opt2}}"]
        },
        variableSchema: {
          variables: [
            { name: "price", type: "number", min: 100, max: 200 },
            { name: "tax", type: "number", min: 10, max: 20 }
          ],
          formulas: [
            "C = price + tax",
            "opt1 = C + 10",
            "opt2 = C - 10"
          ]
        },
        solutionSchema: {
          correctVariable: "C",
          explanationTemplate: "The total is {{price}} + {{tax}} = {{price + tax}}."
        }
      }
    });
    templateId = template.id;
    console.log(`Topic ID: ${topicId}, Concept Code: ${concept.code}, Template ID: ${templateId}\n`);

    console.log("Waiting 1.5 seconds for database sync...");
    await new Promise((r) => setTimeout(r, 1500));

    // 5. Call POST /admin/configs (Create Config)
    console.log("1. API: Creating Exam Configuration...");
    const configRes = await fetch(`${API_URL}/admin/configs`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        name: `E2E Audit Exam ${rand}`,
        code: `audit_code_${rand}`,
        role: "BACKEND",
        durationMinutes: 60,
        totalQuestions: 1
      })
    });
    const configData = await configRes.json();
    if (!configRes.ok || !configData.success) {
      throw new Error(`Failed to create config: ${JSON.stringify(configData)}`);
    }
    examConfigId = configData.data.id;
    console.log(`Config created. Exam Config ID: ${examConfigId}\n`);

    // 5.5 Create Difficulty Distribution
    console.log("1.5 API: Setting Difficulty Distribution (100% Medium)...");
    const diffRes = await fetch(`${API_URL}/admin/configs/${examConfigId}/difficulty`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        easyPercentage: 0,
        mediumPercentage: 100,
        hardPercentage: 0
      })
    });
    const diffData = await diffRes.json();
    if (!diffRes.ok || !diffData.success) {
      throw new Error(`Failed to set difficulty distribution: ${JSON.stringify(diffData)}`);
    }
    console.log("Difficulty distribution set.\n");

    // 6. Call POST /admin/configs/:configId/sections (Create Section)
    console.log("2. API: Creating Exam Section...");
    const sectionRes = await fetch(`${API_URL}/admin/configs/${examConfigId}/sections`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        name: "E2E Section 1",
        code: `sec_1_${rand}`,
        questionCount: 1,
        sectionDurationMinutes: 60,
        sectionOrder: 1
      })
    });
    const sectionData = await sectionRes.json();
    if (!sectionRes.ok || !sectionData.success) {
      throw new Error(`Failed to create section: ${JSON.stringify(sectionData)}`);
    }
    sectionId = sectionData.data.id;
    console.log(`Section created. Section ID: ${sectionId}\n`);

    // 7. Call POST /admin/sections/:sectionId/topics (Map Topic to Section)
    console.log("3. API: Mapping Topic to Section...");
    const mapTopicRes = await fetch(`${API_URL}/admin/sections/${sectionId}/topics`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        topicId: topicId
      })
    });
    const mapTopicData = await mapTopicRes.json();
    if (!mapTopicRes.ok || !mapTopicData.success) {
      throw new Error(`Failed to map topic: ${JSON.stringify(mapTopicData)}`);
    }
    console.log("Topic mapped successfully.\n");

    // 8. Call POST /admin/sections/:sectionId/weightages (Set Weightage)
    console.log("4. API: Setting Topic Weightage (100%)...");
    const weightageRes = await fetch(`${API_URL}/admin/sections/${sectionId}/weightages`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        topicId: topicId,
        weightagePercentage: 100
      })
    });
    const weightageData = await weightageRes.json();
    if (!weightageRes.ok || !weightageData.success) {
      throw new Error(`Failed to assign weightage: ${JSON.stringify(weightageData)}`);
    }
    console.log("Weightage assigned successfully.\n");

    // 9. Call POST /workflows (Start Workflow)
    console.log("5. API: Starting Workflow for Exam Config...");
    const startWorkflowRes = await fetch(`${API_URL}/workflows`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        examId: examConfigId
      })
    });
    const workflowData = await startWorkflowRes.json();
    if (!startWorkflowRes.ok || !workflowData.success) {
      throw new Error(`Failed to start workflow: ${JSON.stringify(workflowData)}`);
    }
    workflowId = workflowData.data.id;
    console.log(`Workflow started. Status: ${workflowData.data.status}, Step: ${workflowData.data.currentStep}\n`);

    // 10. Call POST /workflows/:examId/generate (Generate Questions)
    console.log("6. API: Triggering Question Generation...");
    const genRes = await fetch(`${API_URL}/workflows/${examConfigId}/generate`, {
      method: "POST",
      headers: authHeader
    });
    const genData = await genRes.json();
    if (!genRes.ok || !genData.success) {
      throw new Error(`Failed to trigger generation: ${JSON.stringify(genData)}`);
    }
    console.log("Question generation completed.\n");

    // 11. Call GET /workflows/:examId/questions (Fetch Generated Questions)
    console.log("7. API: Fetching Generated Questions for Review...");
    const getQsRes = await fetch(`${API_URL}/workflows/${examConfigId}/questions?page=1&limit=100`, {
      method: "GET",
      headers: authHeader
    });
    const getQsData = await getQsRes.json();
    if (!getQsRes.ok || !getQsData.success) {
      throw new Error(`Failed to fetch generated questions: ${JSON.stringify(getQsData)}`);
    }
    const questions = getQsData.data.items || getQsData.data.questions || [];
    console.log(`Found ${questions.length} generated questions.`);
    if (questions.length === 0) {
      const logs = await prisma.validationLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5
      });
      console.log("\n--- Latest Validation Logs ---");
      for (const log of logs) {
        console.log(`[${log.validationStage}] isValid: ${log.isValid} | reason: ${log.failureReason}`);
        console.log("errors:", log.errors);
      }

      const genLogs = await prisma.generationLog.findMany({
        where: { examId: examConfigId },
        orderBy: { createdAt: "desc" },
        take: 5
      });
      console.log("\n--- Latest Generation Logs ---");
      for (const log of genLogs) {
        console.log(`[${log.step}] status: ${log.status} | message: ${log.message}`);
      }

      throw new Error("No questions were generated by the API engine.");
    }
    const qIds = questions.map((q: any) => q.id);

    // 12. Call POST /workflows/:examId/questions/bulk-approve (Bulk Approve)
    console.log("8. API: Bulk Approving Questions...");
    const approveRes = await fetch(`${API_URL}/workflows/${examConfigId}/questions/bulk-approve`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        questionIds: qIds
      })
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok || !approveData.success) {
      throw new Error(`Failed to bulk approve questions: ${JSON.stringify(approveData)}`);
    }
    console.log("Bulk approval completed successfully.\n");

    // 13. Call PATCH /workflows/:examId/advance (Advance to Assembly)
    console.log("9. API: Advancing Workflow to Assembly Step...");
    const adv1Res = await fetch(`${API_URL}/workflows/${examConfigId}/advance`, {
      method: "PATCH",
      headers: authHeader
    });
    const adv1Data = await adv1Res.json();
    if (!adv1Res.ok || !adv1Data.success) {
      throw new Error(`Failed to advance workflow: ${JSON.stringify(adv1Data)}`);
    }
    console.log(`Advanced successfully. Current Step: ${adv1Data.data.currentStep}\n`);

    // 14. Call POST /workflows/:examId/assemble (Assemble Test)
    console.log("10. API: Triggering Test Assembly...");
    const assembleRes = await fetch(`${API_URL}/workflows/${examConfigId}/assemble`, {
      method: "POST",
      headers: authHeader
    });
    const assembleData = await assembleRes.json();
    if (!assembleRes.ok || !assembleData.success) {
      throw new Error(`Failed to run assembly: ${JSON.stringify(assembleData)}`);
    }
    console.log("Test assembly completed.\n");

    // 14.5 Create Version Snapshot of Assembly
    console.log("10.5 API: Creating Version Snapshot...");
    const assembledTest = await prisma.assembledTest.findFirst({
      where: { configId: examConfigId }
    });
    if (!assembledTest) {
      throw new Error(`AssembledTest record not found for configId: ${examConfigId}`);
    }
    const assembledTestId = assembledTest.id;
    console.log(`Resolved AssembledTest ID: ${assembledTestId}`);

    const versionRes = await fetch(`${API_URL}/assembly/${assembledTestId}/version`, {
      method: "POST",
      headers: authHeader
    });
    const versionData = await versionRes.json();
    if (!versionRes.ok || !versionData.success) {
      throw new Error(`Failed to create version snapshot: ${JSON.stringify(versionData)}`);
    }
    console.log("Version snapshot created successfully.\n");

    // 15. Call PATCH /workflows/:examId/advance (Advance to Publishing)
    console.log("11. API: Advancing Workflow to Publishing Step...");
    const adv2Res = await fetch(`${API_URL}/workflows/${examConfigId}/advance`, {
      method: "PATCH",
      headers: authHeader
    });
    const adv2Data = await adv2Res.json();
    if (!adv2Res.ok || !adv2Data.success) {
      throw new Error(`Failed to advance workflow: ${JSON.stringify(adv2Data)}`);
    }
    console.log(`Advanced successfully. Current Step: ${adv2Data.data.currentStep}\n`);

    // 16. Call POST /workflows/:examId/publish (Publish Exam)
    console.log("12. API: Publishing Exam...");
    const publishRes = await fetch(`${API_URL}/workflows/${examConfigId}/publish`, {
      method: "POST",
      headers: authHeader
    });
    const publishData = await publishRes.json();
    if (!publishRes.ok || !publishData.success) {
      throw new Error(`Failed to publish workflow: ${JSON.stringify(publishData)}`);
    }
    console.log("Exam successfully published!\n");

    // 17. Verify Published Questions are active in the candidate Question pool
    console.log("13. Verifying active questions in pool...");
    const activeQuestions = await prisma.question.findMany({
      where: { templateId: template.id }
    });
    console.log(`Active questions found in candidate pool: ${activeQuestions.length}`);
    for (const q of activeQuestions) {
      console.log(`- Question Text: "${q.questionText}" | Correct Answer: "${q.answer}"`);
    }

    if (activeQuestions.length === 0) {
      throw new Error("Verification failed: Questions not copied to the active candidate pool.");
    }

    console.log("\n==================================================");
    console.log("✅ AUDIT SUCCESS: All HTTP APIs worked perfectly!");
    console.log("==================================================");

  } catch (err) {
    console.error("\n❌ AUDIT FAILED with error:", err);
  } finally {
    // 18. Cleanup database records
    console.log("\nRunning cleanup...");
    if (templateId) {
      await prisma.question.deleteMany({ where: { templateId } });
      await prisma.generatedQuestion.deleteMany({ where: { templateId } });
    }
    if (sectionId) {
      await prisma.sectionTopic.deleteMany({ where: { sectionId } });
      await prisma.topicWeightage.deleteMany({ where: { sectionId } });
      await prisma.examSection.delete({ where: { id: sectionId } });
    }
    if (workflowId) {
      await prisma.examWorkflowHistory.deleteMany({ where: { workflowId } });
      await prisma.examWorkflow.delete({ where: { id: workflowId } });
    }
    if (examConfigId) {
      await prisma.assemblyVersion.deleteMany({ where: { assemblyId: examConfigId } });
      await prisma.assembledTest.deleteMany({ where: { configId: examConfigId } });
      await prisma.examConfig.delete({ where: { id: examConfigId } });
    }
    if (templateId) {
      await prisma.template.delete({ where: { id: templateId } });
    }
    if (conceptId) {
      await prisma.concept.delete({ where: { id: conceptId } });
    }
    if (topicId) {
      await prisma.topic.delete({ where: { id: topicId } });
    }
    console.log("Cleanup complete.");
  }
}

run();
