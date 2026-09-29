const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findTopicForTemplate(template, topics, concepts) {
  const config = template.config || {};
  const structure = template.structure || {};
  const metadata = template.metadata || {};

  let topicId = config.topicId || (config.topics && config.topics[0]) || structure.topicId || metadata.topicId;
  if (topicId) {
    const found = topics.find(t => t.id === topicId || t.code === topicId);
    if (found) return found;
  }

  if (template.conceptKey) {
    const ckUpper = template.conceptKey.toUpperCase();
    const conceptFound = concepts.find(c => c.code.toUpperCase() === ckUpper || c.id === template.conceptKey || c.name.toUpperCase() === ckUpper);
    if (conceptFound) {
      const parentTopic = topics.find(t => t.id === conceptFound.topicId);
      if (parentTopic) return parentTopic;
    }

    const topicFound = topics.find(t => t.code.toUpperCase() === ckUpper || t.id === template.conceptKey || t.name.toUpperCase() === ckUpper);
    if (topicFound) return topicFound;
  }

  const searchStr = `${template.name} ${template.conceptKey} ${template.description || ''} ${JSON.stringify(config)}`.toUpperCase();
  for (const t of topics) {
    const tNameUpper = t.name.toUpperCase();
    const tCodeUpper = t.code.toUpperCase();
    
    if (searchStr.includes(tNameUpper) || searchStr.includes(tCodeUpper.replace(/_/g, ' '))) {
      return t;
    }
  }

  if (searchStr.includes('ROTATION') || searchStr.includes('ANALOGY') || searchStr.includes('SCALE SHIFT')) {
    const fa = topics.find(t => t.code === 'FIGURE_ANALOGY' || t.name === 'Figure Analogy' || t.code === 'vr-top-002');
    if (fa) return fa;
  }
  if (searchStr.includes('SERIES') || searchStr.includes('POLARITY') || searchStr.includes('PROGRESSION')) {
    const fs = topics.find(t => t.code === 'FIGURE_SERIES' || t.name === 'Figure Series' || t.code === 'vr-top-001');
    if (fs) return fs;
  }

  return null;
}

async function syncTemplate(t, topics, concepts) {
  const config = t.config ? (typeof t.config === 'string' ? JSON.parse(t.config) : t.config) : {};
  const structure = t.structure ? (typeof t.structure === 'string' ? JSON.parse(t.structure) : t.structure) : {};
  const metadata = t.metadata ? (typeof t.metadata === 'string' ? JSON.parse(t.metadata) : t.metadata) : {};
  const template = { ...t, config, structure, metadata };

  const matchedTopic = await findTopicForTemplate(template, topics, concepts);
  if (!matchedTopic) return;

  const questionText = config.questionText || structure.stem || structure.mcq?.questionText || template.name;
  const richOptions = config.richOptions || config.options || structure.mcq?.options || structure.options || metadata.options || [];
  const questionMedia = config.questionMedia || structure.mcq?.questionMedia || structure.media || metadata.questionMedia || null;
  const correctAnswerKey = structure.correctAnswer || richOptions.find(o => o.isCorrect)?.key || "A";
  const explanation = config.solutionExplanation || structure.solution || "";

  let conceptId = null;
  if (template.conceptKey) {
    const concept = concepts.find(c => c.code.toLowerCase() === template.conceptKey.toLowerCase() || c.name.toLowerCase() === template.conceptKey.toLowerCase());
    if (concept) conceptId = concept.id;
  }

  const existingQuestion = await prisma.question.findFirst({
    where: { templateId: template.id },
  });

  const questionData = {
    questionText,
    answer: correctAnswerKey,
    explanation,
    topicId: matchedTopic.id,
    conceptId,
    difficulty: String(template.difficultyLevel || template.difficulty || "MEDIUM").toUpperCase(),
    source: "MANUAL",
    questionSource: "MANUAL",
    questionType: template.questionType || "MCQ",
    templateId: template.id,
    status: "ACTIVE",
    mcqData: {
      options: richOptions,
      correctAnswer: correctAnswerKey,
      questionMedia: questionMedia,
    },
    metadata: {
      isManualTemplateQuestion: true,
      templateId: template.id,
      templateKey: template.templateKey,
      conceptKey: template.conceptKey,
    },
  };

  if (existingQuestion) {
    await prisma.question.update({
      where: { id: existingQuestion.id },
      data: questionData,
    });
    console.log(`UPDATED question ${existingQuestion.id} for template "${template.name}" -> topic "${matchedTopic.name}"`);
  } else {
    const created = await prisma.question.create({
      data: questionData,
    });
    console.log(`CREATED question ${created.id} for template "${template.name}" -> topic "${matchedTopic.name}"`);
  }
}

async function main() {
  const topics = await prisma.topic.findMany();
  const concepts = await prisma.concept.findMany();
  const rawTemplates = await prisma.$queryRaw`SELECT id, name, "generationStrategy", "conceptKey", "templateKey", difficulty, "difficultyLevel", config::text, structure::text FROM "Template"`;

  console.log('--- SYNCING ALL MANUAL & SVG TEMPLATES TO QUESTION BANK ---');
  for (const t of rawTemplates) {
    if (t.generationStrategy === 'MANUAL' || t.generationStrategy === 'SVG') {
      await syncTemplate(t, topics, concepts);
    }
  }

  console.log('\n--- VERIFYING QUESTION COUNTS FOR FIGURE TOPICS ---');
  const figTopics = topics.filter(t => t.code === 'FIGURE_SERIES' || t.code === 'FIGURE_ANALOGY' || t.name.includes('Figure'));
  for (const ft of figTopics) {
    const count = await prisma.question.count({
      where: { topicId: ft.id, status: 'ACTIVE' }
    });
    const easyCount = await prisma.question.count({
      where: { topicId: ft.id, status: 'ACTIVE', difficulty: 'EASY' }
    });
    const medCount = await prisma.question.count({
      where: { topicId: ft.id, status: 'ACTIVE', difficulty: 'MEDIUM' }
    });
    const hardCount = await prisma.question.count({
      where: { topicId: ft.id, status: 'ACTIVE', difficulty: 'HARD' }
    });
    console.log(`Topic: ${ft.name} (${ft.id}) | Total: ${count} | EASY: ${easyCount}, MEDIUM: ${medCount}, HARD: ${hardCount}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
