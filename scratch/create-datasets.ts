import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:MARVEL7ace%4077090@db.ayklmzeqfezrlbkdusqc.supabase.co:5432/postgres?connect_timeout=30",
    },
  },
});

const datasetDefinitions = [
  {
    topicCode: "BOAT_STREAM",
    conceptCode: "BOAT_STREAM",
    name: "Boat Stream Dataset",
    description:
      "Dataset repository for Boat and Stream quantitative aptitude questions.",
  },
  {
    topicCode: "COMPOUND_INTEREST",
    conceptCode: "COMPOUND_INTEREST",
    name: "Compound Interest Dataset",
    description:
      "Dataset repository for Compound Interest quantitative aptitude questions.",
  },
  {
    topicCode: "CYLINDER_CSA",
    conceptCode: "CYLINDER_CSA",
    name: "Cylinder CSA Dataset",
    description:
      "Dataset repository for Cylinder Curved Surface Area mensuration questions.",
  },
  {
    topicCode: "PROBABILITY_BALL",
    conceptCode: "PROBABILITY_BALL",
    name: "Probability Ball Dataset",
    description:
      "Dataset repository for Probability and ball selection questions.",
  },
  {
    topicCode: "SALARY_RATIO",
    conceptCode: "SALARY_RATIO",
    name: "Salary Ratio Dataset",
    description:
      "Dataset repository for Salary and Income Ratio quantitative questions.",
  },
  {
    topicCode: "SPEED_DISTANCE_RATIO",
    conceptCode: "SPEED_DISTANCE_RATIO",
    name: "Speed Distance Ratio Dataset",
    description:
      "Dataset repository for Speed, Distance, and Time Ratio questions.",
  },
  {
    topicCode: "SPEED_FACTOR",
    conceptCode: "SPEED_FACTOR",
    name: "Speed Factor Dataset",
    description:
      "Dataset repository for Speed Factor and Relative Motion questions.",
  },
];

async function main() {
  console.log("--- CREATING DATASETS FOR TOPICS & CONCEPTS ---");

  for (const def of datasetDefinitions) {
    const topic = await prisma.topic.findUnique({
      where: { code: def.topicCode },
    });

    const concept = await prisma.concept.findFirst({
      where: { code: def.conceptCode },
    });

    if (!topic || !concept) {
      console.error(
        `Missing topic (${def.topicCode}) or concept (${def.conceptCode})`,
      );
      continue;
    }

    const dataset = await prisma.dataset.upsert({
      where: { name: def.name },
      update: {
        description: def.description,
        type: "QUANTITATIVE_APTITUDE",
        topicId: topic.id,
        conceptId: concept.id,
      },
      create: {
        name: def.name,
        description: def.description,
        type: "QUANTITATIVE_APTITUDE",
        topicId: topic.id,
        conceptId: concept.id,
      },
    });

    console.log(
      `[DATASET CREATED] ID: ${dataset.id} | Name: "${dataset.name}" | TopicId: ${topic.id} | ConceptId: ${concept.id}`,
    );
  }

  console.log("\nAll 7 datasets created successfully!");
}

main()
  .catch((e) => {
    console.error("Error creating datasets:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
