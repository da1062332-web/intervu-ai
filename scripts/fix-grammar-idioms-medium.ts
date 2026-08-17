import { PrismaClient, QuestionStatus, QuestionSourceType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Seeding Missing MEDIUM Questions for Grammar & Idioms ===");

  const grammarTopic = await prisma.topic.findFirst({
    where: { OR: [{ id: "2048b41a-57f5-447f-a58a-ea135705c913" }, { code: "GRAMMAR" }] },
  });

  const idiomsTopic = await prisma.topic.findFirst({
    where: { OR: [{ id: "4ec340a2-a346-4479-8529-95a4fb966c71" }, { code: "IDIOMS_AND_PHRASES" }] },
  });

  if (grammarTopic) {
    let concept = await prisma.concept.findFirst({ where: { topicId: grammarTopic.id } });
    if (!concept) {
      concept = await prisma.concept.create({
        data: { topicId: grammarTopic.id, name: "Grammar", code: "GRAMMAR", status: "ACTIVE" },
      });
    }

    // Seed 2 MEDIUM Grammar questions
    await prisma.question.create({
      data: {
        questionText: `Choose the correct option to fill in the blank: "Neither the manager nor the employees ________ pleased with the new policy changes."`,
        answer: "opt2",
        explanation: "When subjects are connected by 'neither...nor', the verb agrees with the subject closer to it ('employees', which is plural). Therefore, 'were' is correct.",
        topicId: grammarTopic.id,
        conceptId: concept.id,
        difficulty: "MEDIUM",
        source: "MANUAL",
        questionSource: QuestionSourceType.MANUAL,
        questionType: "MULTIPLE_CHOICE",
        status: QuestionStatus.ACTIVE,
        mcqData: {
          options: [
            { id: "opt1", text: "was", isCorrect: false },
            { id: "opt2", text: "were", isCorrect: true },
            { id: "opt3", text: "is", isCorrect: false },
            { id: "opt4", text: "has been", isCorrect: false },
          ],
          correctAnswer: "opt2",
        },
        metadata: { configCode: "TCS_NQT_PLACEMENT_ASSESSMENT", source: "MANUAL_READINESS_FIX" },
      },
    });

    await prisma.question.create({
      data: {
        questionText: `Identify the sentence that exhibits correct parallel grammatical structure:`,
        answer: "opt2",
        explanation: "Parallel structure requires that items in a list take the same grammatical form (all gerunds: 'swimming', 'running', and 'riding').",
        topicId: grammarTopic.id,
        conceptId: concept.id,
        difficulty: "MEDIUM",
        source: "MANUAL",
        questionSource: QuestionSourceType.MANUAL,
        questionType: "MULTIPLE_CHOICE",
        status: QuestionStatus.ACTIVE,
        mcqData: {
          options: [
            { id: "opt1", text: "She likes swimming, running, and to ride a bicycle.", isCorrect: false },
            { id: "opt2", text: "She likes swimming, running, and riding a bicycle.", isCorrect: true },
            { id: "opt3", text: "She likes to swim, running, and riding a bicycle.", isCorrect: false },
            { id: "opt4", text: "She likes swimming, to run, and riding a bicycle.", isCorrect: false },
          ],
          correctAnswer: "opt2",
        },
        metadata: { configCode: "TCS_NQT_PLACEMENT_ASSESSMENT", source: "MANUAL_READINESS_FIX" },
      },
    });

    console.log("Added 2 MEDIUM questions for Grammar ✅");
  }

  if (idiomsTopic) {
    let concept = await prisma.concept.findFirst({ where: { topicId: idiomsTopic.id } });
    if (!concept) {
      concept = await prisma.concept.create({
        data: { topicId: idiomsTopic.id, name: "Idioms and phrases", code: "IDIOMS_AND_PHRASES", status: "ACTIVE" },
      });
    }

    // Seed 1 MEDIUM Idioms question
    await prisma.question.create({
      data: {
        questionText: `What is the meaning of the idiom "To hit the nail on the head"?`,
        answer: "opt2",
        explanation: "'To hit the nail on the head' means to state or describe a situation or problem with absolute precision.",
        topicId: idiomsTopic.id,
        conceptId: concept.id,
        difficulty: "MEDIUM",
        source: "MANUAL",
        questionSource: QuestionSourceType.MANUAL,
        questionType: "MULTIPLE_CHOICE",
        status: QuestionStatus.ACTIVE,
        mcqData: {
          options: [
            { id: "opt1", text: "To make a costly mistake while working", isCorrect: false },
            { id: "opt2", text: "To describe exactly what is causing a situation or problem", isCorrect: true },
            { id: "opt3", text: "To build something with precision tools", isCorrect: false },
            { id: "opt4", text: "To express anger in public", isCorrect: false },
          ],
          correctAnswer: "opt2",
        },
        metadata: { configCode: "TCS_NQT_PLACEMENT_ASSESSMENT", source: "MANUAL_READINESS_FIX" },
      },
    });

    console.log("Added 1 MEDIUM question for Idioms and phrases ✅");
  }

  // Re-verify counts
  if (grammarTopic) {
    const medCount = await prisma.question.count({
      where: { topicId: grammarTopic.id, difficulty: "MEDIUM", status: "ACTIVE" },
    });
    console.log(`Grammar -> Active MEDIUM: ${medCount} (Required: 3) -> ${medCount >= 3 ? "PASSED ✅" : "FAILED ❌"}`);
  }

  if (idiomsTopic) {
    const medCount = await prisma.question.count({
      where: { topicId: idiomsTopic.id, difficulty: "MEDIUM", status: "ACTIVE" },
    });
    console.log(`Idioms and phrases -> Active MEDIUM: ${medCount} (Required: 3) -> ${medCount >= 3 ? "PASSED ✅" : "FAILED ❌"}`);
  }
}

main()
  .catch((e) => {
    console.error("Error seeding medium questions:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
