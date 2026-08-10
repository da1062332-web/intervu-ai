import { PrismaClient, TopicStatus, ConceptStatus } from "@prisma/client";
import * as fs from "fs/promises";
import * as path from "path";

export async function seedTopics(prisma: PrismaClient) {
  console.log("Seeding Topic Registry...");

  let filePath = path.join(
    process.cwd(),
    "generation/topic-registry/software-engineering.json",
  );
  try {
    await fs.access(filePath);
  } catch {
    filePath = path.join(
      process.cwd(),
      "../../generation/topic-registry/software-engineering.json",
    );
  }

  const content = await fs.readFile(filePath, "utf-8");
  const topics = JSON.parse(content);

  for (const t of topics) {
    const topicCode = t.topic.toUpperCase().replace(/[^A-Z0-9]/g, "_");

    // Seed Topic
    const topic = await prisma.topic.upsert({
      where: { code: topicCode },
      update: {
        name: t.topic,
        description: `${t.domain} - ${t.subtopic}`,
        status: TopicStatus.ACTIVE,
      },
      create: {
        id: t.id,
        name: t.topic,
        code: topicCode,
        description: `${t.domain} - ${t.subtopic}`,
        status: TopicStatus.ACTIVE,
      },
    });

    // Seed child Concepts
    if (t.concepts && Array.isArray(t.concepts)) {
      for (const conceptName of t.concepts) {
        const conceptCode = conceptName
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "_");
        await prisma.concept.upsert({
          where: {
            topicId_code: {
              topicId: topic.id,
              code: conceptCode,
            },
          },
          update: {
            name: conceptName,
            status: ConceptStatus.ACTIVE,
          },
          create: {
            topicId: topic.id,
            name: conceptName,
            code: conceptCode,
            status: ConceptStatus.ACTIVE,
          },
        });
      }
    }
  }
  const extraTopics = [
    { name: "Numerical Ability", code: "NUMERICAL_ABILITY" },
    { name: "Verbal Ability", code: "VERBAL_ABILITY" },
    { name: "Reasoning Ability", code: "REASONING_ABILITY" },
    { name: "Advanced Aptitude", code: "ADVANCED_APTITUDE" },
    { name: "Coding", code: "CODING" },
  ];

  for (const t of extraTopics) {
    const topic = await prisma.topic.upsert({
      where: { code: t.code },
      update: { name: t.name, status: TopicStatus.ACTIVE },
      create: {
        name: t.name,
        code: t.code,
        description: `${t.name} Questions`,
        status: TopicStatus.ACTIVE,
      },
    });

    await prisma.concept.upsert({
      where: {
        topicId_code: {
          topicId: topic.id,
          code: t.code,
        },
      },
      update: {
        name: t.name,
        status: ConceptStatus.ACTIVE,
      },
      create: {
        topicId: topic.id,
        name: t.name,
        code: t.code,
        status: ConceptStatus.ACTIVE,
      },
    });
  }

  console.log(
    `Seeded ${topics.length} base topics and 5 extra topics successfully.`,
  );
}
