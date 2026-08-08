import { PrismaClient, DifficultyLevel } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const concepts = [
    { key: "NUMBER_SYSTEM", type: "mcq", count: 5 },
    { key: "READING_COMPREHENSION", type: "mcq", count: 5 },
    { key: "SYLLOGISM", type: "mcq", count: 5 },
    { key: "PROBABILITY", type: "mcq", count: 5 },
    { key: "ALGORITHMS", type: "coding", count: 2 },
  ];

  for (const concept of concepts) {
    const template = await prisma.template.findFirst({
      where: { conceptKey: concept.key },
    });

    if (!template) {
      console.warn(`No template found for ${concept.key}`);
      continue;
    }

    console.log(`Seeding questions for ${concept.key}...`);

    for (let i = 0; i < concept.count; i++) {
      const qHash = `${concept.key}_${i}_${Date.now()}`;

      let questionData: any = {};

      if (concept.type === "mcq") {
        questionData = {
          templateId: template.id,
          questionHash: qHash,
          conceptKey: concept.key,
          difficultyLevel: "MEDIUM" as DifficultyLevel,
          questionType: "mcq",
          questionText: `Sample question ${i + 1} for ${concept.key}?`,
          options: [
            { id: "opt1", text: "Option A" },
            { id: "opt2", text: "Option B" },
            { id: "opt3", text: "Option C" },
            { id: "opt4", text: "Option D" },
          ],
          correctAnswer: "opt1",
          solution: "This is the explanation for option A.",
          metadata: { isSeeded: true },
        };
      } else {
        questionData = {
          templateId: template.id,
          questionHash: qHash,
          conceptKey: concept.key,
          difficultyLevel: "MEDIUM" as DifficultyLevel,
          questionType: "coding",
          questionText: `Write a program to solve ${concept.key} problem ${i + 1}.`,
          options: [],
          correctAnswer: "",
          solution: "def solve():\n    pass",
          metadata: {
            isSeeded: true,
            language: "python",
            initialCode: "def solve():\n    # write your code here\n    pass",
            testCases: [
              { input: "1", expectedOutput: "1", isHidden: false },
              { input: "2", expectedOutput: "2", isHidden: true },
            ],
          },
        };
      }

      await prisma.generatedQuestion.upsert({
        where: { questionHash: qHash },
        create: questionData,
        update: questionData,
      });
    }
    console.log(
      `Successfully seeded ${concept.count} questions for ${concept.key}.`,
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
