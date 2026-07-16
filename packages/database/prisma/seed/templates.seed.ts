import { PrismaClient, DifficultyLevel } from "@prisma/client";

export async function seedTemplates(prisma: PrismaClient): Promise<void> {
  console.log("Seeding templates...");

  // Delete dependent records to avoid foreign key constraint violations
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Template" CASCADE;');

  const templates = [
    {
      name: "TCS_NQT_NUMERICAL_ABILITY_EASY",
      templateKey: "NUMERICAL_ABILITY_EASY_001",
      conceptKey: "NUMERICAL_ABILITY",
      difficultyLevel: DifficultyLevel.EASY,
      questionType: "multiple_choice",
      description: "Easy numerical ability question",
      isActive: true,
      structure: { prompt: "Solve the basic math problem" },
      variableSchema: {},
      constraints: {},
      solutionSchema: {}
    },
    {
      name: "TCS_NQT_NUMERICAL_ABILITY_MEDIUM",
      templateKey: "NUMERICAL_ABILITY_MED_001",
      conceptKey: "NUMERICAL_ABILITY",
      difficultyLevel: DifficultyLevel.MEDIUM,
      questionType: "multiple_choice",
      description: "Medium numerical ability question",
      isActive: true,
      structure: { prompt: "Solve the math problem" },
      variableSchema: {},
      constraints: {},
      solutionSchema: {}
    },
    {
      name: "TCS_NQT_NUMERICAL_ABILITY_HARD",
      templateKey: "NUMERICAL_ABILITY_HARD_001",
      conceptKey: "NUMERICAL_ABILITY",
      difficultyLevel: DifficultyLevel.HARD,
      questionType: "multiple_choice",
      description: "Hard numerical ability question",
      isActive: true,
      structure: { prompt: "Solve the complex math problem" },
      variableSchema: {},
      constraints: {},
      solutionSchema: {}
    },
    {
      name: "TCS_NQT_VERBAL_ABILITY_EASY",
      templateKey: "VERBAL_ABILITY_EASY_001",
      conceptKey: "VERBAL_ABILITY",
      difficultyLevel: DifficultyLevel.EASY,
      questionType: "multiple_choice",
      description: "Easy verbal ability question",
      isActive: true,
      structure: { prompt: "Answer the basic verbal question" },
      variableSchema: {},
      constraints: {},
      solutionSchema: {}
    },
    {
      name: "TCS_NQT_VERBAL_ABILITY_MEDIUM",
      templateKey: "VERBAL_ABILITY_MED_001",
      conceptKey: "VERBAL_ABILITY",
      difficultyLevel: DifficultyLevel.MEDIUM,
      questionType: "multiple_choice",
      description: "Medium verbal ability question",
      isActive: true,
      structure: { prompt: "Answer the verbal question" },
      variableSchema: {},
      constraints: {},
      solutionSchema: {}
    },
    {
      name: "TCS_NQT_VERBAL_ABILITY_HARD",
      templateKey: "VERBAL_ABILITY_HARD_001",
      conceptKey: "VERBAL_ABILITY",
      difficultyLevel: DifficultyLevel.HARD,
      questionType: "multiple_choice",
      description: "Hard verbal ability question",
      isActive: true,
      structure: { prompt: "Answer the complex verbal question" },
      variableSchema: {},
      constraints: {},
      solutionSchema: {}
    },
    {
      name: "TCS_NQT_REASONING_ABILITY_EASY",
      templateKey: "REASONING_ABILITY_EASY_001",
      conceptKey: "REASONING_ABILITY",
      difficultyLevel: DifficultyLevel.EASY,
      questionType: "multiple_choice",
      description: "Easy reasoning question",
      isActive: true,
      structure: { prompt: "Solve the basic reasoning problem" },
      variableSchema: {},
      constraints: {},
      solutionSchema: {}
    },
    {
      name: "TCS_NQT_REASONING_ABILITY_MEDIUM",
      templateKey: "REASONING_ABILITY_MED_001",
      conceptKey: "REASONING_ABILITY",
      difficultyLevel: DifficultyLevel.MEDIUM,
      questionType: "multiple_choice",
      description: "Medium reasoning question",
      isActive: true,
      structure: { prompt: "Solve the reasoning problem" },
      variableSchema: {},
      constraints: {},
      solutionSchema: {}
    },
    {
      name: "TCS_NQT_REASONING_ABILITY_HARD",
      templateKey: "REASONING_ABILITY_HARD_001",
      conceptKey: "REASONING_ABILITY",
      difficultyLevel: DifficultyLevel.HARD,
      questionType: "multiple_choice",
      description: "Hard reasoning question",
      isActive: true,
      structure: { prompt: "Solve the complex reasoning problem" },
      variableSchema: {},
      constraints: {},
      solutionSchema: {}
    },
    {
      name: "TCS_NQT_ADVANCED_APTITUDE_EASY",
      templateKey: "ADVANCED_APTITUDE_EASY_001",
      conceptKey: "ADVANCED_APTITUDE",
      difficultyLevel: DifficultyLevel.EASY,
      questionType: "multiple_choice",
      description: "Easy advanced aptitude question",
      isActive: true,
      structure: { prompt: "Solve the basic advanced aptitude problem" },
      variableSchema: {},
      constraints: {},
      solutionSchema: {}
    },
    {
      name: "TCS_NQT_ADVANCED_APTITUDE_MEDIUM",
      templateKey: "ADVANCED_APTITUDE_MED_001",
      conceptKey: "ADVANCED_APTITUDE",
      difficultyLevel: DifficultyLevel.MEDIUM,
      questionType: "multiple_choice",
      description: "Medium advanced aptitude question",
      isActive: true,
      structure: { prompt: "Solve the advanced aptitude problem" },
      variableSchema: {},
      constraints: {},
      solutionSchema: {}
    },
    {
      name: "TCS_NQT_ADVANCED_APTITUDE_HARD",
      templateKey: "ADVANCED_APTITUDE_HARD_001",
      conceptKey: "ADVANCED_APTITUDE",
      difficultyLevel: DifficultyLevel.HARD,
      questionType: "multiple_choice",
      description: "Hard advanced aptitude question",
      isActive: true,
      structure: { prompt: "Solve the complex advanced aptitude problem" },
      variableSchema: {},
      constraints: {},
      solutionSchema: {}
    },
    {
      name: "TCS_NQT_CODING_EASY",
      templateKey: "CODING_EASY_001",
      conceptKey: "CODING",
      difficultyLevel: DifficultyLevel.EASY,
      questionType: "coding",
      description: "Easy coding question",
      isActive: true,
      structure: { prompt: "Solve the basic coding problem" },
      variableSchema: {},
      constraints: {},
      solutionSchema: {}
    },
    {
      name: "TCS_NQT_CODING_MEDIUM",
      templateKey: "CODING_MED_001",
      conceptKey: "CODING",
      difficultyLevel: DifficultyLevel.MEDIUM,
      questionType: "coding",
      description: "Medium coding question",
      isActive: true,
      structure: { prompt: "Solve the coding problem" },
      variableSchema: {},
      constraints: {},
      solutionSchema: {}
    },
    {
      name: "TCS_NQT_CODING_HARD",
      templateKey: "CODING_HARD_001",
      conceptKey: "CODING",
      difficultyLevel: DifficultyLevel.HARD,
      questionType: "coding",
      description: "Hard coding question",
      isActive: true,
      structure: { prompt: "Solve the complex coding problem" },
      variableSchema: {},
      constraints: {},
      solutionSchema: {}
    },
  ];

  for (const template of templates) {
    await prisma.template.create({
      data: template,
    });
  }

  console.log("Templates seeded successfully.");
}
