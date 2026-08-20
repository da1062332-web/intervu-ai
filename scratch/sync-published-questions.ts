import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log(
    "--- SYNCING APPROVED/PUBLISHED GENERATED QUESTIONS TO QUESTION TABLE ---",
  );

  const generatedQuestions = await prisma.generatedQuestion.findMany();

  for (const gq of generatedQuestions) {
    const currentMeta = (gq.metadata as any) || {};
    const status = currentMeta.status;

    if (status === "APPROVED" || status === "PUBLISHED") {
      console.log(
        `Processing GQ ${gq.id} (conceptKey: ${gq.conceptKey}, status: ${status})...`,
      );

      // 1. Resolve Topic ID
      let topicId: string | undefined;

      const topicCheck = await prisma.topic.findFirst({
        where: {
          OR: [
            { id: gq.conceptKey },
            { code: { equals: gq.conceptKey, mode: "insensitive" } },
            { name: { equals: gq.conceptKey, mode: "insensitive" } },
          ],
        },
      });

      if (topicCheck?.id) {
        topicId = topicCheck.id;
      } else {
        const concept = await prisma.concept.findFirst({
          where: { code: { equals: gq.conceptKey, mode: "insensitive" } },
        });

        if (concept?.topicId) {
          topicId = concept.topicId;
        } else {
          topicId = (await prisma.topic.findFirst())?.id;
        }
      }

      if (!topicId) {
        console.error(`Could not resolve topic for GQ ${gq.id}`);
        continue;
      }

      // 2. Resolve Section
      let section = await prisma.examSection.findFirst({
        where: { sectionTopics: { some: { topicId } } },
      });
      if (!section) {
        section = await prisma.examSection.findFirst();
      }

      if (!section) {
        let examConfig = await prisma.examConfig.findFirst();
        if (!examConfig) {
          examConfig = await prisma.examConfig.create({
            data: {
              code: "default_config",
              name: "Default Config",
              role: "BACKEND",
              durationMinutes: 60,
              totalQuestions: 10,
            },
          });
        }
        section = await prisma.examSection.create({
          data: {
            examConfigId: examConfig.id,
            name: "Default Section",
            code: "default_section",
            questionCount: 10,
            sectionDurationMinutes: 60,
            sectionOrder: 1,
          },
        });
      }

      // 3. Upsert Question in main pool
      const existing = await prisma.question.findFirst({
        where: {
          OR: [{ questionText: gq.questionText }, { id: gq.id }],
        },
      });

      if (existing) {
        console.log(
          `Question already exists in Question table (id: ${existing.id}), updating topicId to ${topicId}...`,
        );
        await prisma.question.update({
          where: { id: existing.id },
          data: {
            topicId,
            sectionId: section.id,
            status: "ACTIVE",
          },
        });
      } else {
        const created = await prisma.question.create({
          data: {
            questionText: gq.questionText,
            answer: gq.correctAnswer as string,
            explanation: (gq.solution || "") as string,
            topicId,
            sectionId: section.id,
            difficulty: gq.difficultyLevel,
            source: "GENERATED",
            templateId: gq.templateId,
            version: 1,
            status: "ACTIVE",
            metadata: {
              options: gq.options,
              _generatedQuestionId: gq.id,
            },
          },
        });
        console.log(
          `CREATED question in Question table (id: ${created.id}, topicId: ${topicId})`,
        );
      }

      // 4. Ensure metadata status is PUBLISHED
      if (status !== "PUBLISHED") {
        const updatedMeta = {
          ...currentMeta,
          status: "PUBLISHED",
          statusHistory: [
            ...(currentMeta.statusHistory || []),
            {
              status: "PUBLISHED",
              updatedAt: new Date().toISOString(),
            },
          ],
        };
        await prisma.generatedQuestion.update({
          where: { id: gq.id },
          data: { metadata: updatedMeta },
        });
      }
    }
  }

  console.log("\n--- SYNC COMPLETE ---");
  await prisma.$disconnect();
}

main().catch(console.error);
