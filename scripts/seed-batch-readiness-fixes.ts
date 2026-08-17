import { PrismaClient, QuestionStatus, QuestionSourceType } from "@prisma/client";

const prisma = new PrismaClient();

interface QuestionPayload {
  topicName: string;
  topicCode: string;
  topicId?: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questionText: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer: string;
  explanation: string;
}

const batchQuestions: QuestionPayload[] = [
  // --- 1. Idioms and phrases ---
  {
    topicName: "Idioms and phrases",
    topicCode: "IDIOMS_AND_PHRASES",
    topicId: "4ec340a2-a346-4479-8529-95a4fb966c71",
    difficulty: "MEDIUM",
    questionText: `What is the meaning of the idiom "To burn the candle at both ends"?`,
    options: [
      { id: "opt1", text: "To work late into the night and early in the morning, exhausting one's energy", isCorrect: true },
      { id: "opt2", text: "To waste money recklessly on unnecessary luxuries", isCorrect: false },
      { id: "opt3", text: "To celebrate a major milestone with friends and family", isCorrect: false },
      { id: "opt4", text: "To resolve an argument amicably", isCorrect: false },
    ],
    correctAnswer: "opt1",
    explanation: "Burning the candle at both ends means to exhaust one's energy by working long hours without adequate rest.",
  },
  {
    topicName: "Idioms and phrases",
    topicCode: "IDIOMS_AND_PHRASES",
    topicId: "4ec340a2-a346-4479-8529-95a4fb966c71",
    difficulty: "HARD",
    questionText: `Select the idiom that best fits the sentence: "Despite facing immense criticism, the lead developer ________ and successfully delivered the security update."`,
    options: [
      { id: "opt1", text: "bit the bullet and stuck to his guns", isCorrect: true },
      { id: "opt2", text: "threw in the towel and called it a day", isCorrect: false },
      { id: "opt3", text: "let the cat out of the bag", isCorrect: false },
      { id: "opt4", text: "burned his bridges behind him", isCorrect: false },
    ],
    correctAnswer: "opt1",
    explanation: "'Bite the bullet' means to face a difficult situation courageously, and 'stick to one's guns' means to maintain one's position despite opposition.",
  },

  // --- 2. Statements and Conclusion ---
  {
    topicName: "Statements and Conclusion",
    topicCode: "STATEMENTS_AND_CONCLUSION",
    topicId: "2d788994-e6e4-42e3-b12d-820f6c985810",
    difficulty: "EASY",
    questionText: `Statements:
1. All software engineers write code.
2. Some people who write code are technical writers.

Conclusions:
I. Some technical writers are software engineers.
II. All people who write code are software engineers.`,
    options: [
      { id: "opt1", text: "Neither Conclusion I nor II follows", isCorrect: true },
      { id: "opt2", text: "Only Conclusion I follows", isCorrect: false },
      { id: "opt3", text: "Only Conclusion II follows", isCorrect: false },
      { id: "opt4", text: "Both Conclusion I and II follow", isCorrect: false },
    ],
    correctAnswer: "opt1",
    explanation: "From the given statements, we cannot logically conclude that technical writers are software engineers, nor that all code writers are software engineers.",
  },
  {
    topicName: "Statements and Conclusion",
    topicCode: "STATEMENTS_AND_CONCLUSION",
    topicId: "2d788994-e6e4-42e3-b12d-820f6c985810",
    difficulty: "EASY",
    questionText: `Statements:
1. All clouds contain moisture.
2. No moisture is completely dry.

Conclusions:
I. No cloud is completely dry.
II. Some moisture is in the clouds.`,
    options: [
      { id: "opt1", text: "Both Conclusion I and II follow", isCorrect: true },
      { id: "opt2", text: "Only Conclusion I follows", isCorrect: false },
      { id: "opt3", text: "Only Conclusion II follows", isCorrect: false },
      { id: "opt4", text: "Neither Conclusion I nor II follows", isCorrect: false },
    ],
    correctAnswer: "opt1",
    explanation: "Since all clouds contain moisture and no moisture is dry, no cloud can be dry. Also, since all clouds have moisture, moisture is present in clouds.",
  },

  // --- 3. Number Series ---
  {
    topicName: "Number Series",
    topicCode: "NUMBER_SERIES",
    topicId: "fe75f5b0-befc-4b5b-9c7b-9d3094dd154c",
    difficulty: "EASY",
    questionText: `Find the missing number in the series: 7, 14, 28, 56, ?, 224`,
    options: [
      { id: "opt1", text: "112", isCorrect: true },
      { id: "opt2", text: "98", isCorrect: false },
      { id: "opt3", text: "104", isCorrect: false },
      { id: "opt4", text: "120", isCorrect: false },
    ],
    correctAnswer: "opt1",
    explanation: "The pattern is multiplying by 2 at each step: 7*2=14, 14*2=28, 28*2=56, 56*2=112, 112*2=224.",
  },
  {
    topicName: "Number Series",
    topicCode: "NUMBER_SERIES",
    topicId: "fe75f5b0-befc-4b5b-9c7b-9d3094dd154c",
    difficulty: "EASY",
    questionText: `Find the next number in the series: 5, 10, 17, 26, 37, ?`,
    options: [
      { id: "opt1", text: "50", isCorrect: true },
      { id: "opt2", text: "48", isCorrect: false },
      { id: "opt3", text: "52", isCorrect: false },
      { id: "opt4", text: "49", isCorrect: false },
    ],
    correctAnswer: "opt1",
    explanation: "The differences are consecutive odd numbers: +5, +7, +9, +11, +13. Next number = 37 + 13 = 50.",
  },

  // --- 4. Time & Work ---
  {
    topicName: "Time & Work",
    topicCode: "TIME_AND_WORK",
    topicId: "b5b1e6c6-5e4a-4048-ae2e-4c9b8b935bee",
    difficulty: "EASY",
    questionText: `If A can complete a project in 12 days working alone, what fraction of the project does A complete in 1 day?`,
    options: [
      { id: "opt1", text: "1/12", isCorrect: true },
      { id: "opt2", text: "1/6", isCorrect: false },
      { id: "opt3", text: "1/24", isCorrect: false },
      { id: "opt4", text: "1/10", isCorrect: false },
    ],
    correctAnswer: "opt1",
    explanation: "Daily rate of work = 1 / Total days = 1/12.",
  },
  {
    topicName: "Time & Work",
    topicCode: "TIME_AND_WORK",
    topicId: "b5b1e6c6-5e4a-4048-ae2e-4c9b8b935bee",
    difficulty: "EASY",
    questionText: `A can finish a job in 10 days and B can finish the same job in 15 days. Working together, how many days will they take to complete the job?`,
    options: [
      { id: "opt1", text: "6 days", isCorrect: true },
      { id: "opt2", text: "5 days", isCorrect: false },
      { id: "opt3", text: "7.5 days", isCorrect: false },
      { id: "opt4", text: "8 days", isCorrect: false },
    ],
    correctAnswer: "opt1",
    explanation: "Combined rate = 1/10 + 1/15 = 5/30 = 1/6. Time taken together = 6 days.",
  },

  // --- 5. Time, Speed & Distance ---
  {
    topicName: "Time, Speed & Distance",
    topicCode: "TIME_SPEED_AND_DISTANCE",
    topicId: "ad831921-634b-48b0-a423-ec1080de2e17",
    difficulty: "EASY",
    questionText: `A car travels at a constant speed of 72 km/h. What is its speed in meters per second (m/s)?`,
    options: [
      { id: "opt1", text: "20 m/s", isCorrect: true },
      { id: "opt2", text: "18 m/s", isCorrect: false },
      { id: "opt3", text: "25 m/s", isCorrect: false },
      { id: "opt4", text: "15 m/s", isCorrect: false },
    ],
    correctAnswer: "opt1",
    explanation: "To convert km/h to m/s, multiply by 5/18: 72 * (5/18) = 20 m/s.",
  },
  {
    topicName: "Time, Speed & Distance",
    topicCode: "TIME_SPEED_AND_DISTANCE",
    topicId: "ad831921-634b-48b0-a423-ec1080de2e17",
    difficulty: "EASY",
    questionText: `How long does it take for a train to travel 150 km at a uniform speed of 50 km/h?`,
    options: [
      { id: "opt1", text: "3 hours", isCorrect: true },
      { id: "opt2", text: "2.5 hours", isCorrect: false },
      { id: "opt3", text: "3.5 hours", isCorrect: false },
      { id: "opt4", text: "4 hours", isCorrect: false },
    ],
    correctAnswer: "opt1",
    explanation: "Time = Distance / Speed = 150 / 50 = 3 hours.",
  },

  // --- 6. Profit & Loss ---
  {
    topicName: "Profit & Loss",
    topicCode: "PROFIT_AND_LOSS",
    difficulty: "EASY",
    questionText: `An item bought for $80 is sold for $100. What is the profit percentage?`,
    options: [
      { id: "opt1", text: "25%", isCorrect: true },
      { id: "opt2", text: "20%", isCorrect: false },
      { id: "opt3", text: "15%", isCorrect: false },
      { id: "opt4", text: "30%", isCorrect: false },
    ],
    correctAnswer: "opt1",
    explanation: "Profit = $100 - $80 = $20. Profit % = (20 / 80) * 100 = 25%.",
  },
  {
    topicName: "Profit & Loss",
    topicCode: "PROFIT_AND_LOSS",
    difficulty: "EASY",
    questionText: `A laptop purchased for $500 is sold at a loss of 10%. What is the selling price of the laptop?`,
    options: [
      { id: "opt1", text: "$450", isCorrect: true },
      { id: "opt2", text: "$400", isCorrect: false },
      { id: "opt3", text: "$460", isCorrect: false },
      { id: "opt4", text: "$475", isCorrect: false },
    ],
    correctAnswer: "opt1",
    explanation: "Loss = 10% of $500 = $50. Selling price = $500 - $50 = $450.",
  },
];

async function main() {
  console.log("=== Seed Batch Readiness Fix Questions (11 Questions) ===");
  let seededTotal = 0;

  for (const qData of batchQuestions) {
    // 1. Ensure Topic exists
    let topic = null;
    if (qData.topicId) {
      topic = await prisma.topic.findUnique({ where: { id: qData.topicId } });
    }
    if (!topic) {
      topic = await prisma.topic.findFirst({
        where: { OR: [{ code: qData.topicCode }, { name: qData.topicName }] },
      });
    }

    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          ...(qData.topicId ? { id: qData.topicId } : {}),
          name: qData.topicName,
          code: qData.topicCode,
          description: `${qData.topicName} aptitude section`,
          status: "ACTIVE",
        },
      });
      console.log(`Created Topic: ${topic.name} (${topic.id})`);
    }

    // 2. Ensure Concept exists
    let concept = await prisma.concept.findFirst({
      where: { topicId: topic.id },
    });
    if (!concept) {
      concept = await prisma.concept.create({
        data: {
          topicId: topic.id,
          name: topic.name,
          code: topic.code,
          status: "ACTIVE",
        },
      });
    }

    // 3. Create Manual Question
    const question = await prisma.question.create({
      data: {
        questionText: qData.questionText,
        answer: qData.correctAnswer,
        explanation: qData.explanation,
        topicId: topic.id,
        conceptId: concept.id,
        difficulty: qData.difficulty,
        source: "MANUAL",
        questionSource: QuestionSourceType.MANUAL,
        questionType: "MULTIPLE_CHOICE",
        status: QuestionStatus.ACTIVE,
        mcqData: {
          options: qData.options,
          correctAnswer: qData.correctAnswer,
        },
        metadata: {
          configCode: "TCS_NQT_PLACEMENT_ASSESSMENT",
          role: "System Engineer",
          source: "MANUAL_READINESS_FIX",
        },
      },
    });

    console.log(`Created [${qData.difficulty}] Question for '${topic.name}': ${question.id}`);
    seededTotal++;
  }

  console.log(`\nSuccessfully created ${seededTotal} manual questions across 6 topics!`);
}

main()
  .catch((e) => {
    console.error("Error seeding batch questions:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
