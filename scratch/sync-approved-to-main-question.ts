import { PrismaClient } from '@prisma/client';

const dbUrl = "postgresql://postgres:MARVEL7ace%4077090@db.ayklmzeqfezrlbkdusqc.supabase.co:5432/postgres?connect_timeout=60&connection_limit=1";

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

async function syncAllApproved() {
  console.log('=== SYNCING ALL APPROVED / PUBLISHED GENERATED QUESTIONS TO MAIN QUESTION TABLE ===\n');

  // Fetch all GeneratedQuestion with APPROVED or PUBLISHED status
  const genQuestions = await prisma.generatedQuestion.findMany();
  console.log(`Total GeneratedQuestion records: ${genQuestions.length}`);

  const approvedOrPublished = genQuestions.filter((q) => {
    const meta = (q.metadata || {}) as any;
    const status = (meta.status || '').toUpperCase();
    return status === 'APPROVED' || status === 'PUBLISHED';
  });

  console.log(`Approved/Published GeneratedQuestion records: ${approvedOrPublished.length}`);

  let createdCount = 0;
  let updatedCount = 0;

  // Default section & config fallback
  let section = await prisma.examSection.findFirst();
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

  const topics = await prisma.topic.findMany();
  const topicMapByCode = new Map(topics.map((t) => [t.code.toLowerCase(), t.id]));
  const topicMapByName = new Map(topics.map((t) => [t.name.toLowerCase(), t.id]));

  for (const q of approvedOrPublished) {
    // Determine topicId
    let topicId: string | undefined;

    if (q.conceptKey) {
      topicId = topicMapByCode.get(q.conceptKey.toLowerCase()) || topicMapByName.get(q.conceptKey.toLowerCase());
      if (!topicId) {
        const concept = await prisma.concept.findFirst({
          where: { code: { equals: q.conceptKey, mode: 'insensitive' } },
        });
        if (concept?.topicId) topicId = concept.topicId;
      }
    }

    if (!topicId && q.templateId) {
      const tmpl = await prisma.template.findUnique({ where: { id: q.templateId } });
      if (tmpl?.conceptKey) {
        const concept = await prisma.concept.findFirst({
          where: { code: { equals: tmpl.conceptKey, mode: 'insensitive' } },
        });
        if (concept?.topicId) topicId = concept.topicId;
      }
    }

    if (!topicId) {
      // Fallback topic: Error Identification or Reasoning or first topic
      const errTopic = topics.find(t => t.code === 'ERROR_IDENTIFICATION');
      if (errTopic) topicId = errTopic.id;
    }

    if (!topicId) continue;

    const existing = await prisma.question.findFirst({
      where: {
        OR: [
          { id: q.id },
          { questionText: q.questionText },
        ],
      },
    });

    if (existing) {
      await prisma.question.update({
        where: { id: existing.id },
        data: {
          topicId,
          sectionId: section.id,
          status: 'ACTIVE',
          answer: (q.correctAnswer || 'Option 1') as string,
          explanation: (q.solution || '') as string,
          difficulty: q.difficultyLevel || 'MEDIUM',
        },
      });
      updatedCount++;
    } else {
      await prisma.question.create({
        data: {
          id: q.id,
          questionText: q.questionText,
          topicId,
          sectionId: section.id,
          answer: (q.correctAnswer || 'Option 1') as string,
          explanation: (q.solution || '') as string,
          difficulty: q.difficultyLevel || 'MEDIUM',
          source: 'GENERATED',
          status: 'ACTIVE',
        },
      });
      createdCount++;
    }
  }

  console.log(`[SYNC COMPLETE] Created: ${createdCount} new Question records, Updated: ${updatedCount} Question records.`);

  // Print final counts per topic in Question table
  const errorTopic = topics.find(t => t.code === 'ERROR_IDENTIFICATION');
  if (errorTopic) {
    const countInQuestionTable = await prisma.question.count({ where: { topicId: errorTopic.id } });
    console.log(`\nNew total Error Identification questions in Question table: ${countInQuestionTable}`);
  }
}

syncAllApproved()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
