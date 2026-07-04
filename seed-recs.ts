import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const attemptId = "cmr5vh7c50002hc9wv6hcvefp";

  const attempt = await prisma.testInstance.findUnique({
    where: { id: attemptId }
  });

  if (!attempt) {
    console.log("Attempt not found:", attemptId);
    return;
  }

  let evaluationResult = await prisma.evaluationResult.findUnique({
    where: { testInstanceId: attemptId }
  });

  if (!evaluationResult) {
    evaluationResult = await prisma.evaluationResult.create({
      data: {
        userId: attempt.userId,
        testInstanceId: attempt.id,
        communicationScore: 85,
        technicalScore: 90,
        confidenceScore: 80,
        overallScore: 85.5,
        overallRating: 4.5,
        notes: "Good performance overall.",
      }
    });
  }

  // Check if recommendations exist
  const existingRecs = await prisma.recommendation.findMany({
    where: { evaluationId: evaluationResult.id }
  });

  if (existingRecs.length === 0) {
    await prisma.recommendation.createMany({
      data: [
        {
          evaluationId: evaluationResult.id,
          skill: "React",
          priority: "LOW",
          title: "Keep up the good work",
          description: "Your React skills are solid."
        },
        {
          evaluationId: evaluationResult.id,
          skill: "Node.js",
          priority: "HIGH",
          title: "Improve Error Handling",
          description: "Focus on catching and handling asynchronous errors properly."
        }
      ]
    });
    console.log("Added recommendations");
  } else {
    console.log("Recommendations already exist");
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
