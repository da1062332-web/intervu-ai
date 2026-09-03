import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const topicsData = [
  { name: "Basic Programming & Input/Output", code: "CODING_BASIC_IO" },
  { name: "Conditional Statements", code: "CODING_CONDITIONAL" },
  { name: "Loops", code: "CODING_LOOPS" },
  { name: "Numbers & Mathematics", code: "CODING_MATH" },
  { name: "Arrays", code: "CODING_ARRAYS" },
  { name: "Strings", code: "CODING_STRINGS" },
  { name: "Functions", code: "CODING_FUNCTIONS" },
  { name: "Problem Solving / Logical Programming", code: "CODING_LOGICAL" }
];

async function main() {
  console.log("Seeding Cognizant GenC Coding Assessment...");

  // 1. Create Topics
  const topicIds: Record<string, string> = {};
  for (const t of topicsData) {
    const topic = await prisma.topic.upsert({
      where: { code: t.code },
      update: { name: t.name },
      create: {
        name: t.name,
        code: t.code,
        status: "ACTIVE",
        description: t.name + " questions"
      }
    });
    topicIds[t.code] = topic.id;
    console.log(`Topic: ${t.name} -> ${topic.id}`);
  }

  const user = await prisma.user.findFirst();
  const userId = user ? user.id : "system";

  // 2. Create ExamConfig
  const examConfig = await prisma.examConfig.upsert({
    where: { code: "COGNIZANT_GENC_CODING_ASSESSMENT" },
    update: {
      name: "Cognizant GenC Coding Assessment",
      durationMinutes: 120,
      totalQuestions: 2,
      status: "PUBLISHED"
    },
    create: {
      name: "Cognizant GenC Coding Assessment",
      role: "Software Engineer",
      durationMinutes: 120,
      totalQuestions: 2,
      code: "COGNIZANT_GENC_CODING_ASSESSMENT",
      status: "PUBLISHED",
      createdBy: userId,
      description: "Cognizant GenC Coding Assessment containing 2 questions for 120 minutes."
    }
  });
  console.log(`ExamConfig created: ${examConfig.id}`);

  // 3. Create ExamSection
  const section = await prisma.examSection.upsert({
    where: {
      examConfigId_code: {
        examConfigId: examConfig.id,
        code: "CODING_SECTION"
      }
    },
    update: {
      name: "Coding",
      questionCount: 2,
      sectionDurationMinutes: 120
    },
    create: {
      examConfigId: examConfig.id,
      name: "Coding",
      code: "CODING_SECTION",
      questionCount: 2,
      sectionDurationMinutes: 120,
      sectionOrder: 1,
      isRequired: true
    }
  });
  console.log(`ExamSection created: ${section.id}`);

  // 4. Link SectionTopics
  for (const t of topicsData) {
    await prisma.sectionTopic.upsert({
      where: {
        sectionId_topicId: {
          sectionId: section.id,
          topicId: topicIds[t.code]
        }
      },
      update: {},
      create: {
        sectionId: section.id,
        topicId: topicIds[t.code]
      }
    });
  }
  console.log("Topics linked to Section");

  // 5. Seed Coding Questions

  // Question 1: Fuel Consumption
  await prisma.question.create({
    data: {
      questionTitle: "Fuel Consumption Calculation",
      questionText: "Fuel Consumption Calculation",
      questionStatement: "### Problem Statement\nWrite a program to calculate fuel consumption. Given the distance travelled in kilometers and the fuel consumed in liters, calculate the fuel consumption in liters per 100 km. If fuel consumed is <= 0 or distance <= 0, return -1.\n\n### Examples\n#### Example 1\n**Input:** `{\"distance\": 500, \"fuel\": 50}`\n**Output:** `{\"result\": 10}`\n\n#### Example 2\n**Input:** `{\"distance\": -10, \"fuel\": 20}`\n**Output:** `{\"result\": -1}`",
      answer: "return (distance > 0 && fuel > 0) ? (fuel / distance) * 100 : -1",
      explanation: "Calculate (fuel/distance)*100.",
      topicId: topicIds["CODING_BASIC_IO"], // Basic Programming / Mathematics / Conditions
      sectionId: section.id,
      difficulty: "MEDIUM",
      source: "COGNIZANT_SEED",
      questionSource: "MANUAL",
      questionType: "CODING",
      status: "ACTIVE",
      codingData: {
        functionName: "calculateFuelConsumption",
        problemTitle: "Fuel Consumption Calculation",
        starterCode: {
          cpp: "class Solution {\npublic:\n    double calculateFuelConsumption(double distance, double fuel) {\n        // Implement your solution here\n        return -1.0;\n    }\n};",
          java: "class Solution {\n    public double calculateFuelConsumption(double distance, double fuel) {\n        // Implement your solution here\n        return -1.0;\n    }\n}",
          python: "def calculateFuelConsumption(distance: float, fuel: float) -> float:\n    # Implement your solution here\n    pass",
          javascript: "function calculateFuelConsumption(distance, fuel) {\n    // Implement your solution here\n    return -1.0;\n}"
        },
        publicTests: [
          { input: { distance: 500, fuel: 50 }, isPublic: true, expectedOutput: { result: 10 }, explanation: "Standard consumption" },
          { input: { distance: -10, fuel: 20 }, isPublic: true, expectedOutput: { result: -1 }, explanation: "Invalid distance" }
        ],
        hiddenTests: [
          { input: { distance: 250, fuel: 15 }, isPublic: false, expectedOutput: { result: 6 }, explanation: "Valid hidden" }
        ],
        expectedOutput: { result: 10 },
        generatedInput: { distance: 500, fuel: 50 },
        statementSpecification: {
          narrative: "Write a program to calculate fuel consumption.",
          returnType: "FLOAT",
          problemType: "ALGORITHMIC"
        }
      }
    }
  });

  // Question 2: Billing Calculation / Character Mapping
  await prisma.question.create({
    data: {
      questionTitle: "Billing Calculation",
      questionText: "Billing Calculation",
      questionStatement: "### Problem Statement\nWrite a program to calculate the total bill amount. Given an array of item prices and an array of quantities, compute the total bill. Apply a 10% discount if the total exceeds 1000.\n\n### Examples\n#### Example 1\n**Input:** `{\"prices\": [100, 200], \"quantities\": [2, 3]}`\n**Output:** `{\"result\": 800}`\n\n#### Example 2\n**Input:** `{\"prices\": [500, 600], \"quantities\": [1, 1]}`\n**Output:** `{\"result\": 990}`",
      answer: "let total = 0; for(let i=0;i<prices.length;i++) total += prices[i]*quantities[i]; return total > 1000 ? total * 0.9 : total;",
      explanation: "Calculate sum of products and apply discount if > 1000",
      topicId: topicIds["CODING_ARRAYS"], // Arrays / Strings / Logical Problem Solving
      sectionId: section.id,
      difficulty: "HARD", // Medium-Hard -> HARD or MEDIUM
      source: "COGNIZANT_SEED",
      questionSource: "MANUAL",
      questionType: "CODING",
      status: "ACTIVE",
      codingData: {
        functionName: "calculateBill",
        problemTitle: "Billing Calculation",
        starterCode: {
          cpp: "#include <vector>\nclass Solution {\npublic:\n    double calculateBill(std::vector<int> prices, std::vector<int> quantities) {\n        // Implement your solution here\n        return 0.0;\n    }\n};",
          java: "class Solution {\n    public double calculateBill(int[] prices, int[] quantities) {\n        // Implement your solution here\n        return 0.0;\n    }\n}",
          python: "from typing import List\ndef calculateBill(prices: List[int], quantities: List[int]) -> float:\n    # Implement your solution here\n    pass",
          javascript: "function calculateBill(prices, quantities) {\n    // Implement your solution here\n    return 0.0;\n}"
        },
        publicTests: [
          { input: { prices: [100, 200], quantities: [2, 3] }, isPublic: true, expectedOutput: { result: 800 }, explanation: "No discount" },
          { input: { prices: [500, 600], quantities: [1, 1] }, isPublic: true, expectedOutput: { result: 990 }, explanation: "10% discount applied" }
        ],
        hiddenTests: [
          { input: { prices: [1000], quantities: [2] }, isPublic: false, expectedOutput: { result: 1800 }, explanation: "Hidden discount test" }
        ],
        expectedOutput: { result: 800 },
        generatedInput: { prices: [100, 200], quantities: [2, 3] },
        statementSpecification: {
          narrative: "Write a program to calculate the total bill amount with a discount.",
          returnType: "FLOAT",
          problemType: "ALGORITHMIC"
        }
      }
    }
  });

  console.log("Successfully seeded assessment config and 2 coding questions!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
