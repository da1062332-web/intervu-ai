import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Template" CASCADE;');

  const t = await prisma.template.create({
    data: {
      name: "TCS_NQT_APTITUDE",
      description: "Standard TCS NQT Aptitude test blueprint.",
      difficulty: "MEDIUM",
      config: {
        durationMinutes: 90,
        passingScorePercentage: 70,
        sections: [
          { name: "Aptitude", questionCount: 20 },
          { name: "Reasoning", questionCount: 20 },
        ],
      },
      isSystem: true,
      templateKey: "TCS_NQT_APTITUDE",
      conceptKey: "default_concept",
      questionType: "multiple_choice",
    },
  });

  const ecData = {
    name: "TCS NQT Aptitude Config",
    code: "TCS_NQT_APTITUDE",
    role: "TCS Candidate",
    durationMinutes: 90,
    totalQuestions: 40,
    difficultyDistribution: {
      create: {
        easyPercentage: 40,
        mediumPercentage: 40,
        hardPercentage: 20,
      },
    },
    sections: {
      create: [
        {
          name: "Aptitude Section",
          code: "TCS_APTITUDE",
          sectionDurationMinutes: 45,
          questionCount: 20,
          sectionOrder: 1,
          sectionTopics: {
            create: [
              {
                topic: {
                  connectOrCreate: {
                    where: { code: "APTITUDE_BASICS" },
                    create: {
                      name: "Aptitude Basics",
                      code: "APTITUDE_BASICS",
                      description: "Basic aptitude questions",
                      status: "ACTIVE",
                    },
                  },
                },
                topicWeightage: {
                  create: {
                    weightagePercentage: 100,
                  },
                },
              },
            ],
          },
        },
        {
          name: "Reasoning Section",
          code: "TCS_REASONING",
          sectionDurationMinutes: 45,
          questionCount: 20,
          sectionOrder: 2,
          sectionTopics: {
            create: [
              {
                topic: {
                  connectOrCreate: {
                    where: { code: "LOGICAL_REASONING" },
                    create: {
                      name: "Logical Reasoning",
                      code: "LOGICAL_REASONING",
                      description: "Basic reasoning questions",
                      status: "ACTIVE",
                    },
                  },
                },
                topicWeightage: {
                  create: {
                    weightagePercentage: 100,
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };

  // Delete existing config if it exists so we can recreate it properly with nested relations without upserting complex relations
  await prisma.examConfig.deleteMany({ where: { code: "TCS_NQT_APTITUDE" } });

  const ec = await prisma.examConfig.create({
    data: ecData,
  });

  console.log(
    "Deleted all and created Template:",
    t.name,
    "and ExamConfig:",
    ec.code,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
