import { PrismaClient } from "@prisma/client";

export async function seedEvaluations(prisma: PrismaClient) {
  console.log("Seeding mock evaluations, skill scores, recommendations, and performance summaries...");

  // 1. Create mock users
  const usersData = Array.from({ length: 5 }).map((_, i) => ({
    email: `candidate_eval_${i + 1}@example.com`,
    fullName: `Candidate Evaluated ${i + 1}`,
    passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$lSjZq1w1zU8wX2$H5/U4hT4lV7vD9j9K8Fq4g", // mock hash
  }));

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
    users.push(user);
  }

  // Get first test config
  const config = await prisma.testConfig.findFirst();
  if (!config) {
    console.log("No test config found. Skipping evaluations seed.");
    return;
  }

  const skillsList = ["Aptitude", "Reasoning", "TypeScript", "SQL", "Problem Solving"];
  const recommendationsList = [
    { title: "Review time complexity", desc: "Study Big-O notation and recursion." },
    { title: "Practice SQL joins", desc: "Review inner, left, and outer joins with query plans." },
    { title: "Improve verbal logic", desc: "Practice syllogisms and sentence correction." },
    { title: "Refactor nested loops", desc: "Avoid quadratic time complexity in array searches." },
  ];

  // 2. Create 20 test instances and evaluations (4 per user)
  for (const user of users) {
    let completedCount = 0;
    let totalScore = 0;
    let bestScore = 0;

    for (let i = 0; i < 4; i++) {
      const instance = await prisma.testInstance.create({
        data: {
          userId: user.id,
          testConfigId: config.id,
          status: "COMPLETED",
          startedAt: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000),
          submittedAt: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
        },
      });

      const score = Math.floor(60 + Math.random() * 35); // 60 - 95
      totalScore += score;
      completedCount++;
      bestScore = Math.max(bestScore, score);

      await prisma.evaluationResult.create({
        data: {
          testInstanceId: instance.id,
          userId: user.id,
          overallScore: score,
          confidenceScore: parseFloat((0.7 + Math.random() * 0.25).toFixed(2)),
          communicationScore: Math.floor(65 + Math.random() * 30),
          technicalScore: Math.floor(65 + Math.random() * 30),
          overallRating: parseFloat((3.0 + Math.random() * 2.0).toFixed(1)),
          notes: `Mock evaluation for test run ${i + 1}.`,
          totalQuestions: 40,
          correctAnswers: Math.floor(score * 0.4),
          incorrectAnswers: 40 - Math.floor(score * 0.4),
          evaluatedAt: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
          skillScores: {
            create: Array.from({ length: 3 }).map((_, j) => ({
              skill: skillsList[(i + j) % skillsList.length],
              score: Math.floor(score - 5 + Math.random() * 10),
              feedback: `Demonstrates good understanding of ${skillsList[(i + j) % skillsList.length]}.`,
            })),
          },
          recommendations: {
            create: Array.from({ length: 2 }).map((_, j) => {
              const rec = recommendationsList[(i + j) % recommendationsList.length];
              return {
                skill: skillsList[(i + j) % skillsList.length],
                priority: j === 0 ? "HIGH" : "MEDIUM",
                title: rec.title,
                description: rec.desc,
              };
            }),
          },
        },
      });
    }

    // 3. Create PerformanceSummary for the user
    await prisma.performanceSummary.upsert({
      where: { userId: user.id },
      update: {
        testsCompleted: completedCount,
        averageScore: parseFloat((totalScore / completedCount).toFixed(2)),
        bestScore,
        lastAssessmentDate: new Date(),
      },
      create: {
        userId: user.id,
        testsCompleted: completedCount,
        averageScore: parseFloat((totalScore / completedCount).toFixed(2)),
        bestScore,
        lastAssessmentDate: new Date(),
      },
    });
  }
  console.log("Mock evaluations, skills, recommendations, and summaries seeded successfully.");
}
