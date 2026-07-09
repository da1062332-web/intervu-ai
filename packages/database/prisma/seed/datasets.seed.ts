import { PrismaClient } from "@prisma/client";

export async function seedDatasets(prisma: PrismaClient) {
  console.log("Seeding SGE Datasets...");

  // 1. Vocabulary Dataset
  const vocabDataset = await prisma.dataset.upsert({
    where: { name: "Vocabulary Synonym List" },
    update: {},
    create: {
      name: "Vocabulary Synonym List",
      description: "Sample synonym dataset for SGE vocabulary templates",
      type: "VOCABULARY",
    },
  });

  const vocabItems = [
    {
      content: "abundant",
      difficulty: "EASY",
      topic: "synonyms",
      tags: ["english", "synonyms"],
      metadata: { synonym: "plentiful" },
    },
    {
      content: "benevolent",
      difficulty: "MEDIUM",
      topic: "synonyms",
      tags: ["english", "synonyms"],
      metadata: { synonym: "kind" },
    },
    {
      content: "covert",
      difficulty: "HARD",
      topic: "synonyms",
      tags: ["english", "synonyms"],
      metadata: { synonym: "secret" },
    },
  ];

  for (const item of vocabItems) {
    const existing = await prisma.datasetItem.findFirst({
      where: {
        datasetId: vocabDataset.id,
        content: item.content,
      },
    });

    if (!existing) {
      await prisma.datasetItem.create({
        data: {
          datasetId: vocabDataset.id,
          content: item.content,
          difficulty: item.difficulty,
          topic: item.topic,
          tags: item.tags,
          metadata: item.metadata,
        },
      });
    }
  }

  // 2. Reading Comprehension Dataset
  const readingDataset = await prisma.dataset.upsert({
    where: { name: "Reading Comprehension Passages" },
    update: {},
    create: {
      name: "Reading Comprehension Passages",
      description: "Sample reading comprehension passages for SGE text templates",
      type: "READING_PASSAGE",
    },
  });

  const passages = [
    {
      content: "The emergence of artificial intelligence has revolutionized modern software development. Advanced language models can now draft code, run test cases, and analyze errors in real-time, boosting developer efficiency.",
      difficulty: "MEDIUM",
      topic: "reading_comprehension",
      tags: ["english", "reading"],
      metadata: { title: "AI in Software Engineering", length: 35 },
    },
    {
      content: "Photosynthesis is the chemical process by which green plants utilize sunlight to synthesize nutrients from carbon dioxide and water. In this process, plants generate oxygen as a byproduct, sustaining life on Earth.",
      difficulty: "EASY",
      topic: "reading_comprehension",
      tags: ["science", "reading"],
      metadata: { title: "The Mechanism of Photosynthesis", length: 34 },
    },
  ];

  for (const passage of passages) {
    const existing = await prisma.datasetItem.findFirst({
      where: {
        datasetId: readingDataset.id,
        content: passage.content,
      },
    });

    if (!existing) {
      await prisma.datasetItem.create({
        data: {
          datasetId: readingDataset.id,
          content: passage.content,
          difficulty: passage.difficulty,
          topic: passage.topic,
          tags: passage.tags,
          metadata: passage.metadata,
        },
      });
    }
  }

  console.log("SGE Datasets seeded successfully.");
}
