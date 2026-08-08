import { PrismaClient, DifficultyLevel } from "@prisma/client";

const prisma = new PrismaClient();

const questionData: Record<
  string,
  { diff: DifficultyLevel; text: string; opts: string[]; ansIdx: number }[]
> = {
  NUMERICAL_ABILITY: [
    {
      diff: DifficultyLevel.EASY,
      text: "If a train travels 60 km in 2 hours, what is its average speed in km/h?",
      opts: ["20", "30", "40", "60"],
      ansIdx: 1,
    },
    {
      diff: DifficultyLevel.EASY,
      text: "What is 15% of 200?",
      opts: ["15", "30", "45", "60"],
      ansIdx: 1,
    },
    {
      diff: DifficultyLevel.MEDIUM,
      text: "A merchant marks his goods up by 20% and gives a 10% discount. What is his net profit percentage?",
      opts: ["8%", "10%", "12%", "15%"],
      ansIdx: 0,
    },
    {
      diff: DifficultyLevel.MEDIUM,
      text: "Solve for x: 3x + 15 = 45",
      opts: ["5", "10", "15", "20"],
      ansIdx: 1,
    },
    {
      diff: DifficultyLevel.HARD,
      text: "A can do a piece of work in 10 days and B in 15 days. How long will they take if they work together?",
      opts: ["5 days", "6 days", "7.5 days", "8 days"],
      ansIdx: 1,
    },
    {
      diff: DifficultyLevel.HARD,
      text: "The ratio of ages of A and B is 3:4. After 5 years, the ratio becomes 4:5. What is the current age of A?",
      opts: ["10", "15", "20", "25"],
      ansIdx: 1,
    },
  ],
  VERBAL_ABILITY: [
    {
      diff: DifficultyLevel.EASY,
      text: 'Choose the correct synonym for "Happy".',
      opts: ["Sad", "Joyful", "Angry", "Tired"],
      ansIdx: 1,
    },
    {
      diff: DifficultyLevel.EASY,
      text: 'Identify the noun in the sentence: "The quick brown fox jumps over the lazy dog."',
      opts: ["quick", "jumps", "fox", "lazy"],
      ansIdx: 2,
    },
    {
      diff: DifficultyLevel.MEDIUM,
      text: "Choose the word that is correctly spelled.",
      opts: ["Accommodate", "Acommodate", "Accomodate", "Acomodate"],
      ansIdx: 0,
    },
    {
      diff: DifficultyLevel.MEDIUM,
      text: "Fill in the blank: She _______ to the store every day.",
      opts: ["go", "goes", "going", "gone"],
      ansIdx: 1,
    },
    {
      diff: DifficultyLevel.HARD,
      text: "Which of the following is an oxymoron?",
      opts: ["Deafening silence", "Bright light", "Loud noise", "Soft touch"],
      ansIdx: 0,
    },
    {
      diff: DifficultyLevel.HARD,
      text: 'What is the meaning of the idiom "Bite the bullet"?',
      opts: [
        "To eat quickly",
        "To face a difficult situation",
        "To shoot a gun",
        "To break something",
      ],
      ansIdx: 1,
    },
  ],
  REASONING_ABILITY: [
    {
      diff: DifficultyLevel.EASY,
      text: "Find the next number in the series: 2, 4, 6, 8, ...",
      opts: ["9", "10", "11", "12"],
      ansIdx: 1,
    },
    {
      diff: DifficultyLevel.EASY,
      text: "If A is the brother of B, and B is the sister of C, how is A related to C?",
      opts: ["Brother", "Sister", "Cousin", "Uncle"],
      ansIdx: 0,
    },
    {
      diff: DifficultyLevel.MEDIUM,
      text: "SCD, TEF, UGH, ____, WKL",
      opts: ["CMN", "UJI", "VIJ", "IJT"],
      ansIdx: 2,
    },
    {
      diff: DifficultyLevel.MEDIUM,
      text: "Which word does not belong with the others?",
      opts: ["Inch", "Ounce", "Centimeter", "Yard"],
      ansIdx: 1,
    },
    {
      diff: DifficultyLevel.HARD,
      text: 'In a certain code, "COMPUTER" is written as "RFUVQNPC". How is "MEDICINE" written in that code?',
      opts: ["EOJDJEFM", "EOJDEJFM", "MFEJDJOE", "MFEDJJOE"],
      ansIdx: 0,
    },
    {
      diff: DifficultyLevel.HARD,
      text: "Statement: All dogs are mammals. No mammals are birds. Conclusion: No dogs are birds. Is the conclusion valid?",
      opts: ["Yes", "No", "Cannot determine", "Partially true"],
      ansIdx: 0,
    },
  ],
  ADVANCED_APTITUDE: [
    {
      diff: DifficultyLevel.EASY,
      text: "Calculate the probability of getting a heads on a fair coin toss.",
      opts: ["0.25", "0.5", "0.75", "1.0"],
      ansIdx: 1,
    },
    {
      diff: DifficultyLevel.EASY,
      text: "If a triangle has a base of 4 and a height of 5, what is its area?",
      opts: ["10", "12", "20", "22"],
      ansIdx: 0,
    },
    {
      diff: DifficultyLevel.MEDIUM,
      text: "What is the sum of the interior angles of a hexagon?",
      opts: ["360 degrees", "540 degrees", "720 degrees", "900 degrees"],
      ansIdx: 2,
    },
    {
      diff: DifficultyLevel.MEDIUM,
      text: "A box contains 5 red balls and 3 blue balls. If two balls are drawn at random without replacement, what is the probability that both are red?",
      opts: ["10/28", "20/56", "5/14", "15/28"],
      ansIdx: 2,
    },
    {
      diff: DifficultyLevel.HARD,
      text: "Find the determinant of a 2x2 matrix with rows [3, 8] and [4, 6].",
      opts: ["-14", "14", "-24", "24"],
      ansIdx: 0,
    },
    {
      diff: DifficultyLevel.HARD,
      text: "Evaluate the limit of (sin(x)/x) as x approaches 0.",
      opts: ["0", "1", "Infinity", "Undefined"],
      ansIdx: 1,
    },
  ],
  CODING: [
    {
      diff: DifficultyLevel.EASY,
      text: "Which data structure uses LIFO (Last In First Out)?",
      opts: ["Queue", "Stack", "Linked List", "Tree"],
      ansIdx: 1,
    },
    {
      diff: DifficultyLevel.EASY,
      text: "In Python, how do you define a function?",
      opts: [
        "function myFunction():",
        "def myFunction():",
        "create myFunction():",
        "void myFunction():",
      ],
      ansIdx: 1,
    },
    {
      diff: DifficultyLevel.MEDIUM,
      text: "What is the time complexity of binary search on a sorted array?",
      opts: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
      ansIdx: 2,
    },
    {
      diff: DifficultyLevel.MEDIUM,
      text: "Which of the following is NOT a valid access modifier in Java?",
      opts: ["public", "private", "protected", "internal"],
      ansIdx: 3,
    },
    {
      diff: DifficultyLevel.HARD,
      text: "In SQL, which clause is used to filter the results of an aggregate function?",
      opts: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
      ansIdx: 1,
    },
    {
      diff: DifficultyLevel.HARD,
      text: "What is the primary advantage of a B-tree index in a database?",
      opts: [
        "Faster random access",
        "Balanced height for consistent search times",
        "Requires less storage space",
        "Supports duplicate keys easily",
      ],
      ansIdx: 1,
    },
  ],
};

async function main() {
  console.log("Seeding realistic generated questions...");
  let count = 0;

  for (const [conceptKey, questions] of Object.entries(questionData)) {
    const templates = await prisma.template.findMany({
      where: { conceptKey },
    });

    if (templates.length === 0) {
      console.log(`No templates found for ${conceptKey}, skipping...`);
      continue;
    }

    for (const q of questions) {
      // Find matching template difficulty, or fallback to first
      const tpl =
        templates.find((t) => t.difficultyLevel === q.diff) || templates[0];

      const options = q.opts.map((optText, i) => ({
        id: `opt${i + 1}`,
        text: optText,
      }));
      const correctId = `opt${q.ansIdx + 1}`;

      await prisma.generatedQuestion.create({
        data: {
          templateId: tpl.id,
          conceptKey,
          difficultyLevel: q.diff,
          questionType: "MULTIPLE_CHOICE",
          questionText: q.text,
          questionHash: `real-seed-${conceptKey}-${count}-${Date.now()}`,
          options,
          correctAnswer: correctId,
          solution: "This is the correct answer based on the concepts.",
          metadata: { source: "SEED" },
        },
      });
      count++;
    }
  }

  console.log(`Seeded ${count} realistic questions successfully!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
