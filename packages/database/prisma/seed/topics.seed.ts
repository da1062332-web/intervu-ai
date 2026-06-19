import { PrismaClient } from "@prisma/client";
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
    await prisma.topic.upsert({
      where: { id: t.id },
      update: {
        domain: t.domain,
        topicName: t.topic,
        subtopic: t.subtopic,
        tags: t.tags,
        easySupport: t.difficultySupport.easy,
        mediumSupport: t.difficultySupport.medium,
        hardSupport: t.difficultySupport.hard,
      },
      create: {
        id: t.id,
        domain: t.domain,
        topicName: t.topic,
        subtopic: t.subtopic,
        tags: t.tags,
        easySupport: t.difficultySupport.easy,
        mediumSupport: t.difficultySupport.medium,
        hardSupport: t.difficultySupport.hard,
      },
    });
  }
  console.log(`Seeded ${topics.length} topics successfully.`);
}
