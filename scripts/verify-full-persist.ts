import { PrismaClient } from "@prisma/client";

const API_BASE = "http://127.0.0.1:4000/api/v1";
const prisma = new PrismaClient();

async function run() {
  console.log("==========================================");
  console.log("Starting Full Flow API Integration & Persist Test");
  console.log("==========================================\n");

  const timestamp = Date.now();

  try {
    // 1. Authenticate
    console.log("1. Authenticating as Admin...");
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@intervu.ai",
        password: "Intervu123!",
      }),
    });

    if (!loginRes.ok) {
      throw new Error(`Authentication failed: ${await loginRes.text()}`);
    }

    const loginData = await loginRes.json() as any;
    const token = loginData.data?.accessToken || loginData.accessToken;
    const authHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "accept": "*/*"
    };
    console.log("   Authenticated successfully.\n");

    // 2. Create ExamConfig via Prisma
    console.log("2. Creating Exam Config...");
    const examConfig = await prisma.examConfig.create({
      data: {
        name: `E2E Persist Exam ${timestamp}`,
        code: `e2e_persist_exam_${timestamp}`,
        role: "Software Engineer",
        durationMinutes: 60,
        totalQuestions: 10,
        status: "DRAFT"
      }
    });
    console.log(`   Exam Config created. ID: ${examConfig.id}, Code: ${examConfig.code}\n`);

    // 3. Create Section under Exam Config via API
    console.log("3. Creating Section...");
    const sectionRes = await fetch(`${API_BASE}/admin/configs/${examConfig.id}/sections`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "Backend Internals Section",
        code: `backend_internals_${timestamp}`,
        questionCount: 5,
        sectionDurationMinutes: 30,
        sectionOrder: 1,
        isRequired: true
      }),
    });

    if (!sectionRes.ok) {
      throw new Error(`Section creation failed: ${await sectionRes.text()}`);
    }

    const sectionData = await sectionRes.json() as any;
    const sectionId = sectionData.data?.id || sectionData.id;
    console.log(`   Section created successfully. ID: ${sectionId}\n`);

    // 4. Create Topic via API
    console.log("4. Creating Topic...");
    const topicRes = await fetch(`${API_BASE}/admin/topics`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: `NodeJS Event Loop ${timestamp}`,
        code: `nodejs_event_loop_${timestamp}`,
        description: "Topic covering Libuv event loop and thread pool"
      }),
    });

    if (!topicRes.ok) {
      throw new Error(`Topic creation failed: ${await topicRes.text()}`);
    }

    const topicData = await topicRes.json() as any;
    const topicId = topicData.data?.id || topicData.id;
    console.log(`   Topic created successfully. ID: ${topicId}\n`);

    // 5. Map Topic to Section via API
    console.log("5. Mapping Topic to Section...");
    const mappingRes = await fetch(`${API_BASE}/admin/sections/${sectionId}/topics`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        topicId: topicId
      }),
    });

    if (!mappingRes.ok) {
      throw new Error(`Mapping Topic to Section failed: ${await mappingRes.text()}`);
    }
    console.log("   Topic successfully mapped to Section.\n");

    // 6. Create Concept Mapping under Topic via API
    console.log("6. Creating Concept Mapping...");
    const conceptRes = await fetch(`${API_BASE}/admin/topics/${topicId}/concepts`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: `Event Loop Phases ${timestamp}`,
        code: `event_loop_phases_${timestamp}`,
        description: "Timers, pending, idle, poll, check, close phases"
      }),
    });

    if (!conceptRes.ok) {
      throw new Error(`Concept creation failed: ${await conceptRes.text()}`);
    }

    const conceptData = await conceptRes.json() as any;
    const conceptId = conceptData.data?.id || conceptData.id;
    const conceptCode = conceptData.data?.code || conceptData.code;
    console.log(`   Concept created successfully. ID: ${conceptId}, Code: ${conceptCode}\n`);

    // 7. Create Template (Option B) via API
    console.log("7. Creating Template (Option B)...");
    const templateRes = await fetch(`${API_BASE}/templates`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: `Event Loop Template ${timestamp}`,
        conceptKey: conceptCode,
        difficulty: "MEDIUM",
        questionType: "multiple_choice",
        generationStrategy: "VARIABLE",
        structure: {
          questionTemplate: "Which phase of the NodeJS event loop runs callbacks of setImmediate when max queue size is {max_queue_size}?",
          optionsTemplate: ["Check phase", "Timer phase", "Poll phase", "Close phase"]
        },
        variableSchema: {
          variables: [
            {
              name: "max_queue_size",
              type: "integer",
              min: 100,
              max: 500
            }
          ]
        },
        constraints: {
          constraints: []
        },
        solutionSchema: {
          finalAnswer: "Check phase"
        }
      }),
    });

    if (!templateRes.ok) {
      throw new Error(`Template creation failed: ${await templateRes.text()}`);
    }

    const templateData = await templateRes.json() as any;
    const templateId = templateData.data?.id || templateData.id;
    console.log(`   Template created successfully. ID: ${templateId}\n`);

    // 8. Assign Template to Concept via API
    console.log("8. Assigning Template to Concept...");
    const assignRes = await fetch(`${API_BASE}/admin/concepts/${conceptId}/templates`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        templateIds: [templateId]
      }),
    });

    if (!assignRes.ok) {
      throw new Error(`Template assignment failed: ${await assignRes.text()}`);
    }
    console.log("   Template assigned successfully.\n");

    // 9. Generate Question and Save to Database Pool via API
    console.log("9. Triggering AI Question Generation and Pool Save...");
    const generateRes = await fetch(`${API_BASE}/question-generation/generate`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        templateId: templateId,
        count: 1
      }),
    });

    if (!generateRes.ok) {
      throw new Error(`Question generation failed: ${await generateRes.text()}`);
    }

    const generateData = await generateRes.json() as any;
    console.log("   Question generated and saved to pool successfully.");
    console.log("   --- Saved Question details ---");
    console.log(JSON.stringify(generateData.data || generateData, null, 2));
    console.log("   ------------------------------\n");

    console.log("🎉 SUCCESS: E2E PERSISTENT WORKFLOW PASSED!");
    console.log("==========================================");
    console.log("Inspection data left in database:");
    console.log(`- Exam Config ID: ${examConfig.id}`);
    console.log(`- Section ID:     ${sectionId}`);
    console.log(`- Topic ID:       ${topicId}`);
    console.log(`- Concept ID:     ${conceptId}`);
    console.log(`- Template ID:    ${templateId}`);
    console.log("==========================================");

  } catch (err: any) {
    console.error("\n❌ E2E TEST FAILED:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
