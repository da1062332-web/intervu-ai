import { prisma } from "../packages/database/src/client";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_must_be_at_least_32_chars_long_key_12345";

async function testLiveApiReadinessGate() {
  console.log("=================================================");
  console.log("🧪 TESTING LIVE HTTP API READINESS GATE REJECTION (< 100%)");
  console.log("=================================================\n");

  let testConfigId: string | null = null;

  try {
    // 1. Get an ADMIN user from DB
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", deletedAt: null },
    });

    if (!adminUser) {
      console.error("❌ No admin user found in database.");
      return;
    }

    const token = jwt.sign(
      { sub: adminUser.id, email: adminUser.email, role: adminUser.role, type: "access", sessionId: "test-session" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    // 2. Find an active topic to associate
    const topic = await prisma.topic.findFirst({ where: { status: "ACTIVE" } });
    if (!topic) {
      console.error("❌ No active topic found in database.");
      return;
    }

    const timestamp = Date.now();
    // 3. Create a DRAFT ExamConfig that is structurally valid (questions=500, section duration=60)
    // BUT requires 500 questions when topic pool only has ~40 questions!
    // This passes ConfigurationValidatorService, but FAILS Readiness Engine pool capacity check!
    const newConfig = await prisma.examConfig.create({
      data: {
        code: `UNREADY_GATE_TEST_${timestamp}`,
        name: "Pool Shortage Unready Test Config",
        role: "Software Engineer",
        durationMinutes: 60,
        totalQuestions: 500, // Demands 500 questions (capacity insufficient!)
        status: "DRAFT",
        sections: {
          create: [
            {
              code: `UNREADY_SEC_${timestamp}`,
              name: "Pool Capacity Shortage Section",
              sectionDurationMinutes: 60,
              questionCount: 500, // Matches exam total
              sectionOrder: 0,
              sectionTopics: {
                create: [
                  {
                    topicId: topic.id,
                  }
                ]
              }
            }
          ]
        }
      }
    });

    testConfigId = newConfig.id;
    console.log(`📌 Created temporary test ExamConfig: "${newConfig.name}" (ID: ${newConfig.id})`);

    const API_URL = "http://localhost:4000/api/v1";

    // 4. Fetch Readiness from live API server
    console.log(`\n📡 GET ${API_URL}/admin/configs/${testConfigId}/readiness ...`);
    const readinessRes = await fetch(`${API_URL}/admin/configs/${testConfigId}/readiness`, { headers });
    const readinessData = await readinessRes.json();
    const readiness = readinessData.data || readinessData;

    console.log(`\n📊 Live Server Readiness Report:`);
    console.log(`   Score: ${readiness.score}%`);
    console.log(`   Status: ${readiness.status}`);
    console.log(`   Checks Breakdown:`);
    (readiness.checks || []).forEach((c: any) => {
      console.log(`   - [${c.status}] ${c.name}: ${c.message}`);
    });

    // 5. Attempt Publish via live API server (EXPECTED TO BE BLOCKED BY 100% READINESS GATE)
    console.log(`\n🚀 Attempting Publish via POST ${API_URL}/admin/configs/${testConfigId}/publish ...`);
    const publishRes = await fetch(`${API_URL}/admin/configs/${testConfigId}/publish`, {
      method: "POST",
      headers,
    });

    const publishData = await publishRes.json();
    console.log(`   HTTP Status Code: ${publishRes.status} ${publishRes.statusText}`);
    console.log(`   Response Payload:`, JSON.stringify(publishData, null, 2));

    const errorObj = publishData.error || publishData;

    if (publishRes.status === 400) {
      console.log("\n=================================================");
      console.log("🎉 LIVE HTTP API 100% READINESS GATE REJECTION VERIFIED!");
      console.log("=================================================");
      console.log("   The live API server SUCCESSFULLY BLOCKED publication with 400 Bad Request!");
      console.log(`   Error Code: "${errorObj.code}"`);
      console.log(`   Error Message: "${errorObj.message}"`);
      if (errorObj.errors) {
        console.log(`   Failing Check Reasons:`);
        (errorObj.errors || []).forEach((e: string) => console.log(`     * ${e}`));
      }
    } else {
      console.error("\n❌ SAFETY CHECK FAILED: Publishing was not properly blocked for unready config!");
    }

  } catch (error) {
    console.error("Live test failed with error:", error);
  } finally {
    if (testConfigId) {
      console.log(`\n🧹 Cleaning up temporary test config ${testConfigId}...`);
      await prisma.sectionTopic.deleteMany({ where: { section: { examConfigId: testConfigId } } });
      await prisma.examSection.deleteMany({ where: { examConfigId: testConfigId } });
      await prisma.examConfig.delete({ where: { id: testConfigId } });
      console.log("   Cleanup completed.");
    }
    await prisma.$disconnect();
    console.log("\n=================================================");
    console.log("🏁 TEST COMPLETE");
    console.log("=================================================");
  }
}

testLiveApiReadinessGate().catch(console.error);
