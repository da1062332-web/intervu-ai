import { PrismaClient } from "@prisma/client";

const API_BASE = "https://intervu-ai-mkqq.onrender.com/api/v1";
const prisma = new PrismaClient();

async function run() {
  console.log("==========================================");
  console.log("Testing Formula Generation via Backend REST API");
  console.log("==========================================\n");

  try {
    // 1. Authenticate
    console.log("1. Authenticating...");
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

    // 2. Create Template with Formula via API
    console.log("2. Creating Template with Formula...");
    const templateRes = await fetch(`${API_BASE}/templates`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: `API Formula Test ${Date.now()}`,
        conceptKey: "simple_interest",
        difficulty: "MEDIUM",
        questionType: "multiple_choice",
        generationStrategy: "VARIABLE",
        structure: {
          questionTemplate: "Principal: {principal}, Rate: {rate}%, Time: {time} years. Total Interest calculated: ${interest}.",
          optionsTemplate: ["${interest}", "$100", "$250", "$300"]
        },
        variableSchema: {
          variables: [
            { "name": "principal", "type": "integer", "min": 2000, "max": 2000 }, // lock principal to 2000
            { "name": "rate", "type": "integer", "min": 5, "max": 5 }, // lock rate to 5%
            { "name": "time", "type": "integer", "min": 3, "max": 3 }, // lock time to 3 years
            { "name": "interest", "type": "formula", "formula": "(principal * rate * time) / 100" } // Interest formula
          ]
        },
        constraints: {
          constraints: []
        },
        solutionSchema: {
          finalAnswer: "interest"
        }
      }),
    });

    if (!templateRes.ok) {
      throw new Error(`Template creation failed: ${await templateRes.text()}`);
    }

    const templateData = await templateRes.json() as any;
    const templateId = templateData.data?.id || templateData.id;
    console.log(`   Template created. ID: ${templateId}\n`);

    // 3. Request Preview via API to check calculation
    console.log("3. Triggering Question Generation Preview...");
    const previewRes = await fetch(`${API_BASE}/question-generation/preview`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        templateId: templateId
      }),
    });

    if (!previewRes.ok) {
      throw new Error(`Preview request failed: ${await previewRes.text()}`);
    }

    const previewData = await previewRes.json() as any;
    console.log("   Preview details acquired successfully.\n");

    const data = previewData.data;
    console.log("--- Hydration & Calculation Details ---");
    console.log(`- Hydrated Question: "${data.previewText}"`);
    console.log(`- Resolved Variables:`, JSON.stringify(data.context.payload.variables, null, 2));
    console.log(`- Expected Interest Result: (2000 * 5 * 3) / 100 = 300`);
    console.log(`- Calculated Interest value: ${data.context.payload.variables.interest}`);
    console.log("---------------------------------------\n");

    // Assertions
    const calculatedInterest = data.context.payload.variables.interest;
    if (calculatedInterest === 300) {
      console.log("🎉 SUCCESS: Formula was evaluated and computed correctly on the backend server!");
    } else {
      console.error(`❌ FAILURE: Expected interest to be 300, but got ${calculatedInterest}`);
    }

    // 4. Cleanup (Disabled for UI inspection)
    console.log("\n4. Cleanup skipped to keep template in database for UI inspection.");

  } catch (err: any) {
    console.error("\n❌ TEST FAILED:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
