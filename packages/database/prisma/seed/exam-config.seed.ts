import { PrismaClient } from "@prisma/client";

export async function seedExamConfig(prisma: PrismaClient) {
  console.log("Seeding Exam Config...");

  let existingExamConfig = await prisma.examConfig.findFirst({
    where: { name: "Software Engineer Screening", role: "Software Engineer" },
  });

  if (!existingExamConfig) {
    existingExamConfig = await prisma.examConfig.create({
      data: {
        name: "Software Engineer Screening",
        code: "SWE_SCREENING",
        role: "Software Engineer",
        durationMinutes: 60,
        totalQuestions: 30,
      },
    });
    console.log("Seeded ExamConfig: Software Engineer Screening");
  } else {
    console.log("ExamConfig already seeded");
  }

  const existingDistribution = await prisma.difficultyDistribution.findUnique({
    where: { examConfigId: existingExamConfig.id },
  });

  if (!existingDistribution) {
    await prisma.difficultyDistribution.create({
      data: {
        examConfigId: existingExamConfig.id,
        easyPercentage: 30,
        mediumPercentage: 50,
        hardPercentage: 20,
      },
    });
    console.log("Seeded DifficultyDistribution for ExamConfig");
  } else {
    console.log("DifficultyDistribution already seeded");
  }
}
