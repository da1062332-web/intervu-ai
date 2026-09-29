import { PrismaClient, TopicStatus, ConceptStatus } from "@prisma/client";
import * as fs from "fs/promises";
import * as path from "path";

export async function seedTopics(prisma: PrismaClient) {
  console.log("Seeding Topic Registry...");

  const registryFiles = [
    "software-engineering.json",
    "visual-reasoning.json",
  ];

  let totalSeeded = 0;

  for (const fileName of registryFiles) {
    let filePath = path.join(process.cwd(), "generation/topic-registry", fileName);
    try {
      await fs.access(filePath);
    } catch {
      filePath = path.join(process.cwd(), "../../generation/topic-registry", fileName);
    }

    try {
      const content = await fs.readFile(filePath, "utf-8");
      const topics = JSON.parse(content);

      for (const t of topics) {
        const topicCode = t.topicCode || t.topic.toUpperCase().replace(/[^A-Z0-9]/g, "_");

        // Seed Topic
        const topic = await prisma.topic.upsert({
          where: { code: topicCode },
          update: {
            name: t.topic,
            description: `${t.domain || "General"} - ${t.subtopic || t.topic}`,
            status: TopicStatus.ACTIVE,
          },
          create: {
            id: t.id,
            name: t.topic,
            code: topicCode,
            description: `${t.domain || "General"} - ${t.subtopic || t.topic}`,
            status: TopicStatus.ACTIVE,
          },
        });

        // Seed child Concepts (supports detailedConcepts with explicit codes or plain concept strings)
        if (t.detailedConcepts && Array.isArray(t.detailedConcepts)) {
          for (const conceptObj of t.detailedConcepts) {
            const conceptCode = conceptObj.code || conceptObj.name.toUpperCase().replace(/[^A-Z0-9]/g, "_");
            await prisma.concept.upsert({
              where: {
                topicId_code: {
                  topicId: topic.id,
                  code: conceptCode,
                },
              },
              update: {
                name: conceptObj.name,
                status: ConceptStatus.ACTIVE,
              },
              create: {
                topicId: topic.id,
                name: conceptObj.name,
                code: conceptCode,
                status: ConceptStatus.ACTIVE,
              },
            });
          }
        } else if (t.concepts && Array.isArray(t.concepts)) {
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

        totalSeeded++;
      }
    } catch (err: any) {
      console.warn(`Could not read registry file ${fileName}:`, err?.message || err);
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
    `Seeded ${totalSeeded} topics and ${extraTopics.length} extra topics successfully.`,
  );
}
