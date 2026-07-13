import { PrismaClient } from "@prisma/client";

const API_BASE = "http://127.0.0.1:4000/api/v1";
const prisma = new PrismaClient();

async function run() {
  console.log("==========================================");
  console.log("Starting Full Flow API Integration Test");
  console.log("==========================================\n");

  let token = "";
  let topicId = "";
  let conceptId = "";
  let templateId = "";

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
      throw new Error(`Authentication failed with status ${loginRes.status}: ${await loginRes.text()}`);
    }

    const loginData = await loginRes.json() as any;
    token = loginData.data?.accessToken || loginData.accessToken;
    if (!token) {
      throw new Error("Access token not found in login response");
    }
    console.log("   Auth token acquired successfully.\n");

    const authHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "accept": "*/*"
    };

    // 2. Create Topic
    console.log("2. Creating Topic...");
    const topicRes = await fetch(`${API_BASE}/admin/topics`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "API Test Topic " + Date.now(),
        code: "api_test_topic_" + Date.now(),
        description: "Programmatic integration test topic"
      }),
    });

    if (!topicRes.ok) {
      throw new Error(`Topic creation failed with status ${topicRes.status}: ${await topicRes.text()}`);
    }

    const topicData = await topicRes.json() as any;
    topicId = topicData.data?.id || topicData.id;
    console.log(`   Topic created successfully. ID: ${topicId}\n`);

    // 3. Create Concept Mapping under Topic
    console.log("3. Creating Concept Mapping...");
    const conceptRes = await fetch(`${API_BASE}/admin/topics/${topicId}/concepts`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "API Test Concept " + Date.now(),
        code: "api_test_concept_" + Date.now(),
        description: "Programmatic integration test concept"
      }),
    });

    if (!conceptRes.ok) {
      throw new Error(`Concept creation failed with status ${conceptRes.status}: ${await conceptRes.text()}`);
    }

    const conceptData = await conceptRes.json() as any;
    conceptId = conceptData.data?.id || conceptData.id;
    const conceptCode = conceptData.data?.code || conceptData.code;
    console.log(`   Concept created successfully. ID: ${conceptId}, Code: ${conceptCode}\n`);

    // 4. Create Template (Option B: Variable range inside variableSchema JSON)
    console.log("4. Creating Template (Option B)...");
    const templateRes = await fetch(`${API_BASE}/templates`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "API Test Template " + Date.now(),
        conceptKey: conceptCode,
        difficulty: "MEDIUM",
        questionType: "multiple_choice",
        generationStrategy: "VARIABLE",
        structure: {
          questionTemplate: "Programmatic test with max connections: {max_connections}.",
          optionsTemplate: ["{max_connections}", "200", "500"]
        },
        variableSchema: {
          variables: [
            {
              name: "max_connections",
              type: "integer",
              min: 10,
              max: 100
            }
          ]
        },
        constraints: {
          constraints: [
            {
              rule: "max_connections >= 20",
              severity: "critical"
            }
          ]
        },
        solutionSchema: {
          finalAnswer: "max_connections"
        }
      }),
    });

    if (!templateRes.ok) {
      throw new Error(`Template creation failed with status ${templateRes.status}: ${await templateRes.text()}`);
    }

    const templateData = await templateRes.json() as any;
    templateId = templateData.data?.id || templateData.id;
    console.log(`   Template created successfully. ID: ${templateId}\n`);

    // 5. Assign Template to Concept
    console.log("5. Assigning Template to Concept...");
    const assignRes = await fetch(`${API_BASE}/admin/concepts/${conceptId}/templates`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        templateIds: [templateId]
      }),
    });

    if (!assignRes.ok) {
      throw new Error(`Template assignment failed with status ${assignRes.status}: ${await assignRes.text()}`);
    }
    console.log("   Template assigned successfully.\n");

    // 6. Test Question Generation Preview (Option B validation check)
    console.log("6. Testing Question Generation Preview...");
    const previewRes = await fetch(`${API_BASE}/question-generation/preview`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        templateId: templateId
      }),
    });

    if (!previewRes.ok) {
      throw new Error(`Preview generation failed with status ${previewRes.status}: ${await previewRes.text()}`);
    }

    const previewData = await previewRes.json() as any;
    console.log("   Preview response acquired successfully.");
    console.log("   --- Generated Question Preview ---");
    console.log(JSON.stringify(previewData.data || previewData, null, 2));
    console.log("   ----------------------------------\n");

    console.log("🎉 ALL INTEGRATION STEPS PASSED SUCCESSFULLY!");

  } catch (err: any) {
    console.error("\n❌ TEST FAILED:", err.message);
  } finally {
    // Cleanup Database
    console.log("\n7. Cleaning up created database records...");
    try {
      if (templateId) {
        await prisma.templatePreview.deleteMany({ where: { templateId } });
        await prisma.question.deleteMany({ where: { templateId } });
        await prisma.template.delete({ where: { id: templateId } });
      }
      if (conceptId) {
        await prisma.concept.delete({ where: { id: conceptId } });
      }
      if (topicId) {
        await prisma.topic.delete({ where: { id: topicId } });
      }
      console.log("   Database cleaned up successfully.");
    } catch (cleanupErr: any) {
      console.error("   Cleanup failed:", cleanupErr.message);
    }
    await prisma.$disconnect();
  }
}

run();
