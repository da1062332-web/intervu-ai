import { PrismaClient, DifficultyLevel } from '@prisma/client';
import { generateQuestionHash } from '../../src/utils/hash-question.util';

export async function seedDay2Questions(prisma: PrismaClient) {
  console.log('--- Starting Day 2 Seed: Question Pool ---');

  const templates = await prisma.template.findMany();
  if (templates.length === 0) {
    console.warn('⚠️ No templates found! Please run the Day 1 seed first.');
    return;
  }

  const difficulties: DifficultyLevel[] = ['EASY', 'MEDIUM', 'HARD'];
  let totalSeeded = 0;

  for (const template of templates) {
    console.log(`Seeding questions for template: ${template.templateKey}`);
    const questionsToInsert = [];

    // Generate 10 mock questions per template
    for (let i = 1; i <= 10; i++) {
      const diff = difficulties[i % 3];
      const params = { varA: i * 5, varB: i * 2 };
      const options = ['A', 'B', 'C', `Answer ${i}`];
      const correctAnswer = `Answer ${i}`;

      const hash = generateQuestionHash({
        templateId: template.id,
        parameters: params,
        options,
        correctAnswer
      });

      questionsToInsert.push({
        templateId: template.id,
        questionHash: hash,
        conceptKey: template.conceptKey,
        difficultyLevel: diff,
        questionType: template.questionType,
        questionText: `Generated Question ${i} for ${template.conceptKey}`,
        options,
        correctAnswer,
        solution: `Mock solution for Q${i}`,
        metadata: { seedRun: 'DAY2' }
      });
    }

    const result = await prisma.generatedQuestion.createMany({
      data: questionsToInsert,
      skipDuplicates: true
    });

    totalSeeded += result.count;
  }

  console.log(`✅ Day 2 Seed Complete: ${totalSeeded} questions injected into the Question Pool.`);
}
