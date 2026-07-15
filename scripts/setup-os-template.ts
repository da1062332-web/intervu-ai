import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("==========================================");
  console.log("Setting up Operating Systems Topic & CPU Scheduling Concept");
  console.log("==========================================\n");

  try {
    // 1. Create or Find Topic
    console.log("1. Checking 'Operating Systems' Topic...");
    let topic = await prisma.topic.findFirst({
      where: { code: "operating_systems" }
    });

    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          name: "Operating Systems",
          code: "operating_systems",
          description: "Operating Systems core concepts including processes, memory, and threads.",
          status: "ACTIVE"
        }
      });
      console.log(`   Created new Topic: ${topic.name} (${topic.code})`);
    } else {
      console.log(`   Topic already exists: ${topic.name} (${topic.code})`);
    }

    // 2. Create or Find Concept under Topic
    console.log("\n2. Checking 'CPU Scheduling' Concept...");
    let concept = await prisma.concept.findFirst({
      where: { code: "cpu_scheduling" }
    });

    if (!concept) {
      concept = await prisma.concept.create({
        data: {
          name: "CPU Scheduling",
          code: "cpu_scheduling",
          topicId: topic.id,
          status: "ACTIVE"
        }
      });
      console.log(`   Created new Concept: ${concept.name} (${concept.code}) under topic ${topic.name}`);
    } else {
      console.log(`   Concept already exists: ${concept.name} (${concept.code})`);
    }

    // 3. Find or Create the Formula Template and link it to this new Concept
    const templateId = "cmrj47xf6009o1130n416ll36";
    console.log(`\n3. Linking template ${templateId} to concept '${concept.code}'...`);

    let template = await prisma.template.findUnique({
      where: { id: templateId }
    });

    if (template) {
      await prisma.template.update({
        where: { id: templateId },
        data: { conceptKey: concept.code }
      });
      console.log(`   Successfully updated template '${template.name}' to point to concept '${concept.code}'!`);
    } else {
      // If template was deleted or not found, create a new one
      const newTemplate = await prisma.template.create({
        data: {
          name: "CPU Scheduling Math Formula",
          conceptKey: concept.code,
          difficulty: "MEDIUM",
          questionType: "multiple_choice",
          generationStrategy: "VARIABLE",
          structure: {
            questionTemplate: "Principal: {principal}, Rate: {rate}%, Time: {time} years. Total Interest calculated: ${interest}.",
            optionsTemplate: ["${interest}", "$100", "$250", "$300"]
          },
          variableSchema: {
            variables: [
              { "name": "principal", "type": "integer", "min": 2000, "max": 2000 },
              { "name": "rate", "type": "integer", "min": 5, "max": 5 },
              { "name": "time", "type": "integer", "min": 3, "max": 3 },
              { "name": "interest", "type": "formula", "formula": "(principal * rate * time) / 100" }
            ]
          },
          constraints: {
            constraints: []
          },
          solutionSchema: {
            finalAnswer: "interest"
          }
        }
      });
      console.log(`   Template ${templateId} was not found, so created a new one: '${newTemplate.name}' with ID: '${newTemplate.id}' under concept '${concept.code}'!`);
    }

    console.log("\n🎉 SETUP COMPLETED SUCCESSFULLY!");
    console.log("You can now find the template in the UI under:");
    console.log(`- Topic: ${topic.name}`);
    console.log(`- Concept: ${concept.name}`);

  } catch (err: any) {
    console.error("❌ Setup failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
