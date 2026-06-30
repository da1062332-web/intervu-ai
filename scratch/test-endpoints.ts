import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const API_URL = "http://127.0.0.1:4000/api/v1";
const JWT_SECRET =
  process.env.JWT_SECRET || "replace-with-a-long-secret-at-least-32-chars";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:MARVEL7ace%4077090@db.ayklmzeqfezrlbkdusqc.supabase.co:5432/postgres",
    },
  },
});

async function main() {
  console.log("==========================================");
  console.log("Starting API Endpoint Integration Verification");
  console.log("==========================================\n");

  let adminUserId: string | null = null;

  try {
    // 1. Create Dummy ADMIN User
    const email = `admin_verify_${Date.now()}@example.com`;
    console.log(`Creating dummy ADMIN user with email: ${email}`);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: "dummyhash",
        fullName: "Test Admin User",
        role: "ADMIN",
      },
    });
    adminUserId = user.id;

    // 2. Sign Admin JWT Token
    console.log("Signing Admin JWT Token...");
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: "access",
        sessionId: "dummy-session",
      },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // 3. Test POST /prompts
    console.log("\n--> Testing POST /prompts...");
    const postPromptRes = await fetch(`${API_URL}/prompts`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Quantitative Aptitude",
        category: "quantitative",
        content: "Default quantitative prompt template",
      }),
    });
    const postPromptData = await postPromptRes.json();
    console.log(
      "POST /prompts Response:",
      JSON.stringify(postPromptData, null, 2),
    );
    if (postPromptRes.status !== 201) {
      throw new Error(
        `Failed to create prompt: status ${postPromptRes.status}`,
      );
    }

    // 4. Test GET /prompts
    console.log("\n--> Testing GET /prompts...");
    const getPromptsRes = await fetch(`${API_URL}/prompts`, {
      method: "GET",
      headers,
    });
    const getPromptsData = await getPromptsRes.json();
    console.log(
      "GET /prompts Response (length):",
      Array.isArray(getPromptsData.data)
        ? getPromptsData.data.length
        : typeof getPromptsData.data,
    );
    if (getPromptsRes.status !== 200) {
      throw new Error(`Failed to get prompts: status ${getPromptsRes.status}`);
    }

    // 5. Test POST /generation/topic-expand
    console.log("\n--> Testing POST /generation/topic-expand...");
    const topicExpandRes = await fetch(`${API_URL}/generation/topic-expand`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        topic: "Percentages",
      }),
    });
    const topicExpandData = await topicExpandRes.json();
    console.log(
      "POST /generation/topic-expand Response:",
      JSON.stringify(topicExpandData, null, 2),
    );
    if (topicExpandRes.status !== 201) {
      throw new Error(
        `Failed to expand topic: status ${topicExpandRes.status}`,
      );
    }

    // 6. Test POST /generation/jobs
    console.log("\n--> Testing POST /generation/jobs...");
    const postJobRes = await fetch(`${API_URL}/generation/jobs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        topic: "Percentages",
        count: 5,
        category: "Quantitative Aptitude",
        difficulty: "Medium",
      }),
    });
    const postJobData = await postJobRes.json();
    console.log(
      "POST /generation/jobs Response:",
      JSON.stringify(postJobData, null, 2),
    );
    if (postJobRes.status !== 201) {
      throw new Error(
        `Failed to trigger generation job: status ${postJobRes.status}`,
      );
    }
    const jobId = postJobData.data.id;

    // 7. Poll Job Status
    console.log(`\n--> Polling job status for job ID: ${jobId}...`);
    let completed = false;
    let jobStatus: any = {};
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const getJobRes = await fetch(`${API_URL}/generation/jobs/${jobId}`, {
        method: "GET",
        headers,
      });
      jobStatus = await getJobRes.json();
      console.log(`Poll #${i + 1} status:`, jobStatus.data.status);
      if (
        jobStatus.data.status === "COMPLETED" ||
        jobStatus.data.status === "FAILED"
      ) {
        completed = true;
        break;
      }
    }
    console.log(
      "Final Job Status Details:",
      JSON.stringify(jobStatus, null, 2),
    );
    if (!completed) {
      throw new Error("Job polling timed out.");
    }
    if (jobStatus.data.status === "FAILED") {
      throw new Error(
        `Job execution failed in backend: ${jobStatus.data.error}`,
      );
    }

    // 8. Test GET /generation/dashboard
    console.log("\n--> Testing GET /generation/dashboard...");
    const dashboardRes = await fetch(`${API_URL}/generation/dashboard`, {
      method: "GET",
      headers,
    });
    const dashboardData = await dashboardRes.json();
    console.log(
      "GET /generation/dashboard Response:",
      JSON.stringify(dashboardData, null, 2),
    );
    if (dashboardRes.status !== 200) {
      throw new Error(
        `Failed to get dashboard metrics: status ${dashboardRes.status}`,
      );
    }

    console.log("\n==========================================");
    console.log("All API integration checks: PASS ✅");
    console.log("==========================================\n");
  } catch (error: any) {
    console.error("\n❌ API Integration check failed:");
    console.error(error.message || error);
    process.exit(1);
  } finally {
    // 9. Cleanup
    if (adminUserId) {
      console.log(`Cleaning up dummy ADMIN user ID: ${adminUserId}`);
      await prisma.user
        .delete({
          where: { id: adminUserId },
        })
        .catch(() => {});
    }
    await prisma.$disconnect();
  }
}

main();
