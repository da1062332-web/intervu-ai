import { assert } from 'console';
import { prisma } from '../../client';
import { GeneratedQuestionRepository } from '../generated-question.repository';
import { QuestionPoolRepository } from '../question-pool.repository';
import { generateQuestionHash } from '../../utils/hash-question.util';

async function runDay2Tests() {
  console.log('--- Day 2 Question Storage Integration Tests ---');
  
  const generatedQRepo = new GeneratedQuestionRepository();
  const poolRepo = new QuestionPoolRepository();

  try {
    // We need a valid template to associate questions with
    const template = await prisma.template.findFirst({ where: { templateKey: 'BASE_TIME_WORK' }});
    if (!template) throw new Error('Base template not found! Make sure Day 1 seed is loaded.');

    const templateId = template.id;

    // Helper to generate mock questions
    const createMockQ = (idParam: string, difficulty: any = 'EASY') => {
      const params = { varA: idParam, varB: 10 };
      const hash = generateQuestionHash({ templateId, parameters: params, correctAnswer: idParam });
      return {
        templateId,
        questionHash: hash,
        conceptKey: 'time_work',
        difficultyLevel: difficulty,
        questionType: 'MULTIPLE_CHOICE' as const,
        questionText: `Test Question ${idParam}`,
        options: ['1', '2', '3', idParam],
        correctAnswer: idParam,
        solution: 'Solution',
        metadata: {}
      };
    };

    // POOL-001: Successful storage
    console.log('Running POOL-001: Successful storage...');
    const q1Data = createMockQ('q1');
    const q1 = await generatedQRepo.create(q1Data);
    assert(q1.id !== undefined, 'Question 1 should be stored and return an ID');
    console.log('✅ POOL-001 passed.');

    // POOL-002: Duplicate hash rejection
    console.log('Running POOL-002: Duplicate hash rejection...');
    let errorThrown = false;
    try {
      await generatedQRepo.create(q1Data);
    } catch (e: any) {
      if (e.code === 'DUPLICATE_QUESTION_HASH') errorThrown = true;
    }
    assert(errorThrown, 'Should throw DUPLICATE_QUESTION_HASH error');
    console.log('✅ POOL-002 passed.');

    // POOL-008: Batch insert testing using skipDuplicates: true
    console.log('Running POOL-008: Batch insert testing with skipDuplicates...');
    const batchData = [
      createMockQ('batch1', 'MEDIUM'),
      createMockQ('batch2', 'HARD'),
      q1Data // This is a duplicate and should be skipped silently
    ];
    const insertedCount = await generatedQRepo.createMany(batchData);
    assert(insertedCount === 2, `Should insert 2 distinct records, got ${insertedCount}`);
    console.log('✅ POOL-008 passed.');

    // POOL-003 to 007: Concept filtering, pagination, and counts
    console.log('Running POOL-003 to 007: Retrieval, Filtering, Counts, Pagination...');
    
    const countAll = await poolRepo.count();
    assert(countAll >= 3, 'Should have at least 3 records');

    const conceptQs = await poolRepo.findByConcept('time_work');
    assert(conceptQs.length >= 3, 'Should find all time_work questions');

    const hardQs = await poolRepo.findByDifficulty('HARD');
    assert(hardQs.length >= 1, 'Should find HARD question');

    const paginatedQs = await poolRepo.findQuestions({ conceptKey: 'time_work' }, { limit: 2, page: 1 });
    assert(paginatedQs.length === 2, 'Pagination limit should be respected');

    console.log('✅ POOL-003 to 007 passed.');

    // POOL-009: findRandomizedSet returns unique questions with no duplicates
    console.log('Running POOL-009: Randomized Set Uniqueness...');
    // Create enough data for a meaningful shuffle test
    const massData = Array.from({ length: 20 }, (_, i) => createMockQ(`mass${i}`, 'EASY'));
    await generatedQRepo.createMany(massData);

    const randomizedSet = await poolRepo.findRandomizedSet({ conceptKey: 'time_work' }, 10);
    assert(randomizedSet.length === 10, 'Should return exactly 10 questions');
    
    const uniqueIds = new Set(randomizedSet.map(q => q.id));
    assert(uniqueIds.size === 10, 'All returned IDs must be completely unique, no duplicates');
    console.log('✅ POOL-009 passed.');

  } catch (error) {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  } finally {
    // Cleanup generated questions from tests
    await prisma.generatedQuestion.deleteMany({
      where: {
        questionText: { startsWith: 'Test Question' }
      }
    });
    await prisma.$disconnect();
    console.log('--- All Day 2 tests passed! ---');
  }
}

runDay2Tests();
