import { PrismaClient, DifficultyLevel } from "@prisma/client";

async function seedQuestionPool() {
  console.log("=== SEEDING QUESTION POOL FOR CONCEPTS ===");
  const prisma = new PrismaClient();

  try {
    // 1. Ensure a Default Template exists in `template` table
    let defaultTemplate = await prisma.template.findFirst({
      where: { isActive: true },
    });

    if (!defaultTemplate) {
      defaultTemplate = await prisma.template.create({
        data: {
          id: "tmpl_default_mcq",
          name: "Default MCQ Template",
          version: 1,
          conceptKey: "percentages",
          isActive: true,
          variables: {},
          rules: {},
        },
      });
      console.log("- Created default template: tmpl_default_mcq");
    } else {
      console.log(`- Template present: ${defaultTemplate.id}`);
    }

    const templateId = defaultTemplate.id;

    // 2. Define concept questions to seed
    const conceptQuestions = [
      // Percentages
      {
        conceptKey: "percentages",
        difficultyLevel: DifficultyLevel.MEDIUM,
        questionText: "What is 20% of 150?",
        options: ["20", "25", "30", "35"],
        correctAnswer: "30",
        solution: "20% of 150 = (20/100) * 150 = 30.",
      },
      {
        conceptKey: "percentages",
        difficultyLevel: DifficultyLevel.MEDIUM,
        questionText: "If a price increases from $80 to $100, what is the percentage increase?",
        options: ["20%", "25%", "30%", "15%"],
        correctAnswer: "25%",
        solution: "Increase = 20. Percentage = (20/80) * 100 = 25%.",
      },
      {
        conceptKey: "percentages",
        difficultyLevel: DifficultyLevel.EASY,
        questionText: "What is 50% of 90?",
        options: ["40", "45", "50", "35"],
        correctAnswer: "45",
        solution: "50% of 90 = 45.",
      },

      // Aptitude
      {
        conceptKey: "aptitude",
        difficultyLevel: DifficultyLevel.MEDIUM,
        questionText: "A train running at 60 km/hr passes a pole in 9 seconds. What is the length of the train?",
        options: ["120 metres", "150 metres", "180 metres", "324 metres"],
        correctAnswer: "150 metres",
        solution: "Speed = 60 * (5/18) = 50/3 m/s. Length = (50/3) * 9 = 150 metres.",
      },
      {
        conceptKey: "aptitude",
        difficultyLevel: DifficultyLevel.MEDIUM,
        questionText: "If A can finish a work in 10 days and B in 15 days, how long will they take working together?",
        options: ["5 days", "6 days", "8 days", "7 days"],
        correctAnswer: "6 days",
        solution: "Combined rate = 1/10 + 1/15 = 1/6. Total days = 6.",
      },

      // Reasoning
      {
        conceptKey: "reasoning",
        difficultyLevel: DifficultyLevel.MEDIUM,
        questionText: "Which number comes next in the series: 2, 6, 12, 20, 30, ...?",
        options: ["36", "40", "42", "44"],
        correctAnswer: "42",
        solution: "Differences are +4, +6, +8, +10, +12. 30 + 12 = 42.",
      },

      // Technical / Frontend / React
      {
        conceptKey: "react_hooks",
        difficultyLevel: DifficultyLevel.MEDIUM,
        questionText: "Which hook should be used for side effects in a functional React component?",
        options: ["useState", "useMemo", "useEffect", "useCallback"],
        correctAnswer: "useEffect",
        solution: "useEffect performs side effects in function components.",
      },
      {
        conceptKey: "coding",
        difficultyLevel: DifficultyLevel.MEDIUM,
        questionText: "What is the time complexity of quicksort in the worst case?",
        options: ["O(N)", "O(N log N)", "O(N^2)", "O(1)"],
        correctAnswer: "O(N^2)",
        solution: "Quicksort worst case complexity is O(N^2) when partitions are unbalanced.",
      },
    ];

    console.log("\n2. Seeding questions into GeneratedQuestion pool...");
    let createdCount = 0;

    for (let i = 0; i < conceptQuestions.length; i++) {
      const q = conceptQuestions[i];
      const questionId = `seed_${q.conceptKey}_${q.difficultyLevel.toLowerCase()}_${i + 1}`;

      const existing = await prisma.generatedQuestion.findUnique({
        where: { id: questionId },
      });

      if (!existing) {
        await prisma.generatedQuestion.create({
          data: {
            id: questionId,
            questionHash: questionId,
            templateId,
            conceptKey: q.conceptKey,
            difficultyLevel: q.difficultyLevel,
            questionType: "mcq",
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            solution: q.solution,
            metadata: {},
          },
        });
        createdCount++;
      }
    }

    console.log(`- Seeded ${createdCount} new questions into GeneratedQuestion table.`);
    console.log("=== QUESTION POOL SEEDING COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

seedQuestionPool();
