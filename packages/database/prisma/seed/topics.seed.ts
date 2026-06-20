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
  console.log(
    `Seeded ${topics.length} topics and their concepts successfully.`,
  );
}
