import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../apps/api/.env") });

const prisma = new PrismaClient();

const API_URL = "http://localhost:4000/api/v1";
const rand = Date.now();

async function run() {
  console.log("==================================================");
  console.log("Starting Full 17-Step E2E Workflow Verification");
  console.log("==================================================\n");

  let topicId = "";
  let conceptId = "";
  let templateId = "";
  let examConfigId = "";
  let sectionId = "";
  let workflowId = "";
  let questionId = "";
  let assembledTestId = "";

  try {
    // 0. Verify local API health
    const healthRes = await fetch(`${API_URL}/health`);
    if (!healthRes.ok) {
      throw new Error(`API server is not running or healthy at ${API_URL}`);
    }
    console.log("✅ API server is running and healthy.\n");

    // Resolve Admin user and generate token
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    });
    if (!admin) {
      throw new Error("No ADMIN user found in database. Run seeding first.");
    }
    console.log(`Resolving Admin User: ${admin.email}`);

    // Generate Admin Authorization Header (simulating login session)
    const authHeader = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${require("jsonwebtoken").sign(
        {
          sub: admin.id,
          email: admin.email,
          role: admin.role,
          type: "access"
        },
        process.env.JWT_SECRET || "replace-with-a-long-secret-at-least-32-chars"
      )}`
    };

    // 1. Create a brand new Topic and Concept in the database
    console.log("Step 1: Database - Creating new Topic and Concept...");
    const topicCode = `verify_topic_${rand}`;
    const conceptCode = `verify_concept_${rand}`;

    const topic = await prisma.topic.create({
      data: {
        code: topicCode,
        name: "Verify E2E Topic",
        description: "Topic for full workflow test",
        status: "ACTIVE"
      }
    });
    topicId = topic.id;

    const concept = await prisma.concept.create({
      data: {
        code: conceptCode,
        name: "Verify E2E Concept",
        topicId: topic.id,
        description: "Concept for full workflow test",
        status: "ACTIVE"
      }
    });
    conceptId = concept.id;
    console.log(`Created Topic ID: ${topicId}`);
    console.log(`Created Concept Code: ${conceptCode}\n`);

    // Wait 1.5 seconds for DB indexes sync
    await new Promise((res) => setTimeout(res, 1500));

    // 2. Call POST /templates (Create Template Metadata & Schemas)
    console.log("Step 2: API - Creating Template Metadata & Schemas...");
    const templateKey = `verify_tpl_${rand}`;
    const templateRes = await fetch(`${API_URL}/templates`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        name: "E2E Verify Math Template",
        templateKey: templateKey,
        conceptKey: conceptCode,
        questionType: "multiple_choice",
        difficulty: "MEDIUM",
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
      })
    });
    const templateData = await templateRes.json();
    if (!templateRes.ok || !templateData.success) {
      throw new Error(`Failed to create template: ${JSON.stringify(templateData)}`);
    }
    templateId = templateData.data.id;
    console.log(`Created Template CUID: ${templateId}\n`);

    // 3. Call POST /templates/:id/question (Set Question Text Blueprint)
    console.log("Step 3: API - Setting Template Question Text Blueprint...");
    const questionTextRes = await fetch(`${API_URL}/templates/${templateId}/question`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        questionTemplate: "A product is priced at {{price}} USD. The tax is {{tax}} USD. What is the total price?"
      })
    });
    const questionTextData = await questionTextRes.json();
    if (!questionTextRes.ok || !questionTextData.success) {
      throw new Error(`Failed to set question text: ${JSON.stringify(questionTextData)}`);
    }
    console.log("Question text template set successfully.\n");

    // 4. Call POST /templates/:id/options (Set Options/Choices Blueprint)
    console.log("Step 4: API - Setting Template Options Blueprint...");
    const optionsRes = await fetch(`${API_URL}/templates/${templateId}/options`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        optionsTemplate: ["{{C}}", "{{opt1}}", "{{opt2}}"]
      })
    });
    const optionsData = await optionsRes.json();
    if (!optionsRes.ok || !optionsData.success) {
      throw new Error(`Failed to set options: ${JSON.stringify(optionsData)}`);
    }
    console.log("Options template set successfully.\n");

    // 5. Call POST /admin/configs (Create Exam Configuration)
    console.log("Step 5: API - Creating Exam Configuration...");
    const configRes = await fetch(`${API_URL}/admin/configs`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        name: "E2E Workflow Verification Exam",
        code: `verify_exam_config_${rand}`,
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
    console.log(`Created Exam Config ID: ${examConfigId}\n`);

    // 6. Call POST /admin/configs/:id/difficulty (Set Difficulty Distribution)
    console.log("Step 6: API - Setting Difficulty Distribution (100% Medium)...");
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
    console.log("Difficulty distribution configured.\n");

    // 7. Call POST /admin/configs/:id/sections (Create Section)
    console.log("Step 7: API - Creating Exam Section...");
    const sectionRes = await fetch(`${API_URL}/admin/configs/${examConfigId}/sections`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        name: "Core Math Section",
        code: `verify_sec_${rand}`,
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
    console.log(`Created Section ID: ${sectionId}\n`);

    // 8. Call POST /admin/sections/:sectionId/topics (Map Topic to Section)
    console.log("Step 8: API - Mapping Topic to Section...");
    const mapRes = await fetch(`${API_URL}/admin/sections/${sectionId}/topics`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({ topicId })
    });
    const mapData = await mapRes.json();
    if (!mapRes.ok || !mapData.success) {
      throw new Error(`Failed to map topic: ${JSON.stringify(mapData)}`);
    }
    console.log("Topic mapped successfully.\n");

    // 9. Call POST /admin/sections/:sectionId/weightages (Set Weightage)
    console.log("Step 9: API - Setting Topic Weightage (100%)...");
    const weightRes = await fetch(`${API_URL}/admin/sections/${sectionId}/weightages`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        topicId,
        weightagePercentage: 100
      })
    });
    const weightData = await weightRes.json();
    if (!weightRes.ok || !weightData.success) {
      throw new Error(`Failed to assign weightage: ${JSON.stringify(weightData)}`);
    }
    console.log("Topic weightage set successfully.\n");

    // 10. Call POST /workflows (Start Workflow)
    console.log("Step 10: API - Initializing Workflow...");
    const workflowRes = await fetch(`${API_URL}/workflows`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({ examId: examConfigId })
    });
    const workflowData = await workflowRes.json();
    if (!workflowRes.ok || !workflowData.success) {
      throw new Error(`Failed to initialize workflow: ${JSON.stringify(workflowData)}`);
    }
    workflowId = workflowData.data.id;
    console.log(`Workflow started. Status: ${workflowData.data.status}, Step: ${workflowData.data.currentStep}\n`);

    // 11. Call POST /workflows/:examId/generate (Generate Questions)
    console.log("Step 11: API - Triggering Question Generation...");
    const genRes = await fetch(`${API_URL}/workflows/${examConfigId}/generate`, {
      method: "POST",
      headers: authHeader
    });
    const genData = await genRes.json();
    if (!genRes.ok || !genData.success) {
      throw new Error(`Failed to generate questions: ${JSON.stringify(genData)}`);
    }
    console.log("Question generation completed.\n");

    // 12. Call GET /workflows/:examId/questions (Fetch Generated Questions)
    console.log("Step 12: API - Fetching Generated Questions for Review...");
    const fetchQuestionsRes = await fetch(
      `${API_URL}/workflows/${examConfigId}/questions?page=1&limit=10&status=DRAFT`,
      { headers: authHeader }
    );
    const fetchQuestionsData = await fetchQuestionsRes.json();
    if (!fetchQuestionsRes.ok || !fetchQuestionsData.success) {
      throw new Error(`Failed to fetch draft questions: ${JSON.stringify(fetchQuestionsData)}`);
    }

    const draftQuestions = fetchQuestionsData.data.items || [];
    console.log(`Found ${draftQuestions.length} draft questions.`);
    if (draftQuestions.length === 0) {
      throw new Error("No draft questions generated.");
    }
    questionId = draftQuestions[0].id;
    console.log(`Selected Question ID: ${questionId}\n`);

    // 13. Call POST /workflows/:examId/questions/bulk-approve (Approve Question)
    console.log("Step 13: API - Bulk Approving Questions...");
    const approveRes = await fetch(`${API_URL}/workflows/${examConfigId}/questions/bulk-approve`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({ questionIds: [questionId] })
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok || !approveData.success) {
      throw new Error(`Failed to bulk approve: ${JSON.stringify(approveData)}`);
    }
    console.log("Bulk approval completed successfully.\n");

    // 14. Call PATCH /workflows/:examId/advance (Advance to Assembly)
    console.log("Step 14: API - Advancing Workflow to Assembly Step...");
    const advRes = await fetch(`${API_URL}/workflows/${examConfigId}/advance`, {
      method: "PATCH",
      headers: authHeader
    });
    const advData = await advRes.json();
    if (!advRes.ok || !advData.success) {
      throw new Error(`Failed to advance workflow: ${JSON.stringify(advData)}`);
    }
    console.log(`Advanced successfully. Current Step: ${advData.data.currentStep}\n`);

    // 15. Call POST /workflows/:examId/assemble (Assemble Test)
    console.log("Step 15: API - Triggering Test Assembly...");
    const assembleRes = await fetch(`${API_URL}/workflows/${examConfigId}/assemble`, {
      method: "POST",
      headers: authHeader
    });
    const assembleData = await assembleRes.json();
    if (!assembleRes.ok || !assembleData.success) {
      throw new Error(`Failed to run assembly: ${JSON.stringify(assembleData)}`);
    }
    console.log("Test assembly completed.\n");

    // Resolve AssembledTest ID from database
    console.log("Step 15.5: Database - Resolving AssembledTest ID...");
    const assembledTest = await prisma.assembledTest.findFirst({
      where: { configId: examConfigId }
    });
    if (!assembledTest) {
      throw new Error(`AssembledTest record not found for configId: ${examConfigId}`);
    }
    assembledTestId = assembledTest.id;
    console.log(`Resolved AssembledTest ID: ${assembledTestId}\n`);

    // 16. Call POST /assembly/:id/version (Create Version Snapshot)
    console.log("Step 16: API - Creating Version Snapshot...");
    const versionRes = await fetch(`${API_URL}/assembly/${assembledTestId}/version`, {
      method: "POST",
      headers: authHeader
    });
    const versionData = await versionRes.json();
    if (!versionRes.ok || !versionData.success) {
      throw new Error(`Failed to create version snapshot: ${JSON.stringify(versionData)}`);
    }
    console.log("Version snapshot created successfully.\n");

    // Advance to Publishing Step
    console.log("Step 16.5: API - Advancing Workflow to Publishing Step...");
    const adv2Res = await fetch(`${API_URL}/workflows/${examConfigId}/advance`, {
      method: "PATCH",
      headers: authHeader
    });
    const adv2Data = await adv2Res.json();
    if (!adv2Res.ok || !adv2Data.success) {
      throw new Error(`Failed to advance workflow: ${JSON.stringify(adv2Data)}`);
    }
    console.log(`Advanced successfully. Current Step: ${adv2Data.data.currentStep}\n`);

    // 17. Call POST /workflows/:examId/publish (Publish Exam)
    console.log("Step 17: API - Publishing Exam...");
    const publishRes = await fetch(`${API_URL}/workflows/${examConfigId}/publish`, {
      method: "POST",
      headers: authHeader
    });
    const publishData = await publishRes.json();
    if (!publishRes.ok || !publishData.success) {
      throw new Error(`Failed to publish workflow: ${JSON.stringify(publishData)}`);
    }
    console.log("Exam successfully published!\n");

    // Verify Published Questions are active in the candidate Question pool
    console.log("Step 17.5: Database - Verifying active questions in candidate pool...");
    const activeQuestions = await prisma.question.findMany({
      where: { templateId: templateId }
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
    console.log(`Topic ID:        ${topicId}`);
    console.log(`Concept Code:    ${conceptCode}`);
    console.log(`Template CUID:   ${templateId}`);
    console.log(`Exam Config ID:  ${examConfigId}`);
    console.log(`Section ID:      ${sectionId}`);
    console.log(`Question ID:     ${questionId}`);
    console.log(`Assembled ID:    ${assembledTestId}`);
    console.log("==================================================\n");
    console.log("⚠️ No cleanup has been run. You can inspect all data directly in the database.");

  } catch (err) {
    console.error("\n❌ AUDIT FAILED with error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
