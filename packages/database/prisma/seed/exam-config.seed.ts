import { PrismaClient } from "@prisma/client";

export async function seedExamConfig(prisma: PrismaClient) {
  console.log("Seeding Exam Config...");

  const existingExamConfig = await prisma.examConfig.findFirst({
    where: { name: "Software Engineer Screening", role: "Software Engineer" },
  });

  if (!existingExamConfig) {
    await prisma.examConfig.create({
      data: {
        name: "Software Engineer Screening",
        role: "Software Engineer",
        durationMinutes: 60,
        totalQuestions: 30,
      },
    });
    console.log("Seeded ExamConfig: Software Engineer Screening");
  } else {
    console.log("ExamConfig already seeded");
  }
}
