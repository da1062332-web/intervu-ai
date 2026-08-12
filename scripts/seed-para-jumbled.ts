import { PrismaClient, QuestionStatus, QuestionSourceType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Seed Manual Questions for Topic: Para Jumbled ===");

  // 1. Ensure Topic "Para Jumbled" exists
  const topicCode = "PARA_JUMBLED";
  const topicName = "Para Jumbled";

  let topic = await prisma.topic.findFirst({
    where: { OR: [{ code: topicCode }, { name: topicName }] },
  });

  if (!topic) {
    topic = await prisma.topic.create({
      data: {
        name: topicName,
        code: topicCode,
        description: "Para Jumbled sentence ordering questions",
        status: "ACTIVE",
      },
    });
    console.log(`Created Topic: ${topic.name} (${topic.id})`);
  } else {
    console.log(`Found Topic: ${topic.name} (${topic.id})`);
  }

  // 2. Ensure Concept exists
  let concept = await prisma.concept.findFirst({
    where: { topicId: topic.id },
  });

  if (!concept) {
    concept = await prisma.concept.create({
      data: {
        topicId: topic.id,
        name: topicName,
        code: topicCode,
        status: "ACTIVE",
      },
    });
    console.log(`Created Concept: ${concept.name} (${concept.id})`);
  } else {
    console.log(`Found Concept: ${concept.name} (${concept.id})`);
  }

  // 3. Define 2 EASY and 1 HARD Para Jumbled questions
  const questionsToSeed = [
    // --- EASY Question 1 ---
    {
      difficulty: "EASY",
      questionText: `Rearrange the following sentences to form a logical paragraph:

A. They provide essential services such as food processing and waste management.
B. Microorganisms play a vital role in our environment.
C. Without them, nutrients would not cycle through ecosystems effectively.
D. Therefore, preserving microbial diversity is crucial for planetary health.`,
      options: [
        { id: "opt1", text: "B - A - C - D", isCorrect: true },
        { id: "opt2", text: "A - B - C - D", isCorrect: false },
        { id: "opt3", text: "C - D - A - B", isCorrect: false },
        { id: "opt4", text: "D - C - B - A", isCorrect: false },
      ],
      correctAnswer: "opt1",
      explanation: "Sentence B introduces the main topic (microorganisms). Sentence A elaborates on their services. Sentence C highlights what happens without them. Sentence D concludes with the recommendation.",
    },

    // --- EASY Question 2 ---
    {
      difficulty: "EASY",
      questionText: `Rearrange the following sentences into a coherent paragraph:

A. The company announced its quarterly earnings report yesterday morning.
B. Stock prices jumped by nearly 8% immediately following the announcement.
C. The Chief Executive Officer praised the team for achieving record operational efficiency.
D. Analysts attribute this sudden rise to stronger than expected product sales.`,
      options: [
        { id: "opt1", text: "A - C - B - D", isCorrect: true },
        { id: "opt2", text: "C - B - D - A", isCorrect: false },
        { id: "opt3", text: "B - A - D - C", isCorrect: false },
        { id: "opt4", text: "D - C - A - B", isCorrect: false },
      ],
      correctAnswer: "opt1",
      explanation: "Sentence A states the event (earnings report). Sentence C details the executive's remark during the report. Sentence B describes the stock market reaction, and D provides analyst commentary on the stock jump.",
    },

    // --- HARD Question 1 ---
    {
      difficulty: "HARD",
      questionText: `Rearrange the following sentences into a logical paragraph:

A. Quantum computing leverages superposition and entanglement to process vast amounts of data simultaneously.
B. Classical computers store information as binary bits, representing either 0 or 1.
C. While this promise offers unprecedented speedups for complex simulations, maintaining qubit coherence remains an enormous engineering hurdle.
D. In contrast, quantum bits (qubits) can exist in a state representing both 0 and 1 at the same time.`,
      options: [
        { id: "opt1", text: "B - D - A - C", isCorrect: true },
        { id: "opt2", text: "A - B - C - D", isCorrect: false },
        { id: "opt3", text: "D - A - B - C", isCorrect: false },
        { id: "opt4", text: "C - D - A - B", isCorrect: false },
      ],
      correctAnswer: "opt1",
      explanation: "Sentence B establishes classical binary bits as the baseline. Sentence D introduces quantum bits (qubits) by contrast. Sentence A explains how qubits function (superposition/entanglement). Sentence C concludes by addressing the engineering challenges.",
    },
  ];

  let createdCount = 0;

  for (const qData of questionsToSeed) {
    const q = await prisma.question.create({
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

    console.log(`Created [${qData.difficulty}] Question: ${q.id}`);
    createdCount++;
  }

  console.log(`\nSuccessfully created ${createdCount} manual questions for Para Jumbled!`);
}

main()
  .catch((e) => {
    console.error("Error seeding manual questions:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
