import { PrismaClient, QuestionStatus, QuestionSourceType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Seed Manual Questions for Topic: Grammar ===");

  const topicCode = "GRAMMAR";
  const topicName = "Grammar";

  // 1. Ensure Topic "Grammar" exists
  let topic = await prisma.topic.findFirst({
    where: { OR: [{ code: topicCode }, { name: topicName }] },
  });

  if (!topic) {
    topic = await prisma.topic.create({
      data: {
        name: topicName,
        code: topicCode,
        description: "Grammar rules, sentence correction, and error spot questions",
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

  // 3. Define HARD Grammar question
  const questionData = {
    difficulty: "HARD",
    questionText: `Identify the sentence that contains a grammatical error:`,
    options: [
      {
        id: "opt1",
        text: "Not only did she complete the assignment ahead of schedule, but she also presented her findings flawlessly.",
        isCorrect: false,
      },
      {
        id: "opt2",
        text: "Neither the project lead nor the software engineers was aware of the database security vulnerability.",
        isCorrect: true,
      },
      {
        id: "opt3",
        text: "Had the system administrators implemented the patch earlier, the breach could have been prevented.",
        isCorrect: false,
      },
      {
        id: "opt4",
        text: "Scarcely had the server restarted when users reported receiving connection timeout errors.",
        isCorrect: false,
      },
    ],
    correctAnswer: "opt2",
    explanation:
      "In sentence 2, when subjects are joined by 'neither...nor', the verb agrees with the subject closer to it ('software engineers', which is plural). Therefore, 'was aware' is incorrect and should be replaced with 'were aware'.",
  };

  const q = await prisma.question.create({
    data: {
      questionText: questionData.questionText,
      answer: questionData.correctAnswer,
      explanation: questionData.explanation,
      topicId: topic.id,
      conceptId: concept.id,
      difficulty: questionData.difficulty,
      source: "MANUAL",
      questionSource: QuestionSourceType.MANUAL,
      questionType: "MULTIPLE_CHOICE",
      status: QuestionStatus.ACTIVE,
      mcqData: {
        options: questionData.options,
        correctAnswer: questionData.correctAnswer,
      },
      metadata: {
        configCode: "TCS_NQT_PLACEMENT_ASSESSMENT",
        role: "System Engineer",
        source: "MANUAL_READINESS_FIX",
      },
    },
  });

  console.log(`Created [HARD] Question: ${q.id}`);

  // Verify count
  const hardCount = await prisma.question.count({
    where: { topicId: topic.id, difficulty: "HARD", status: "ACTIVE" },
  });

  console.log(`\nTopic 'Grammar' Question Pool Status:`);
  console.log(`  - Active HARD Questions: ${hardCount} (Required: 1) -> ${hardCount >= 1 ? "PASSED ✅" : "FAILED ❌"}`);
}

main()
  .catch((e) => {
    console.error("Error seeding grammar question:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
