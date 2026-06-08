import { assert } from 'console';
import { prisma } from '../../client';
import { GeneratedQuestionRepository } from '../generated-question.repository';
import { TestConfigRepository } from '../test-config.repository';

async function runTests() {
  console.log('--- Day 1 Integration Tests ---');
  
  const generatedQRepo = new GeneratedQuestionRepository();
  const configRepo = new TestConfigRepository();

  try {
    // TESTCFG-001: Config Retrieval
    console.log('Running TESTCFG-001...');
    const config = await configRepo.findByConfigKey('TCS_NQT_APTITUDE');
    if (!config) throw new Error('TCS NQT Config not found! Seed failed.');
    assert(config.sections.length === 2, 'Should have 2 sections');
    assert(config.rule !== null, 'Should have rules attached');
    console.log('✅ TESTCFG-001: Config retrieval successful.');

    // GENQ-002: Duplicate Hash Rejection
    console.log('Running GENQ-002...');
    const template = await prisma.template.findFirst({ where: { templateKey: 'BASE_TIME_WORK' }});
    if (!template) throw new Error('Base template not found! Seed failed.');

    const qData = {
      templateId: template.id,
      questionHash: 'HASH_123',
      conceptKey: 'time_work',
      difficultyLevel: 'MEDIUM' as const,
      questionType: 'MULTIPLE_CHOICE',
      questionText: 'If A does work in 10 days...',
      options: ['1', '2', '3', '4'],
      correctAnswer: '2',
      solution: 'Explanation',
      metadata: {}
    };

    // First insert should succeed
    await generatedQRepo.create(qData);
    console.log('   First insertion successful.');

    // Second insert should fail with DUPLICATE_QUESTION_HASH
    let errorThrown = false;
    try {
      await generatedQRepo.create(qData);
    } catch (e: any) {
      if (e.code === 'DUPLICATE_QUESTION_HASH') {
        errorThrown = true;
      }
    }
    assert(errorThrown, 'Duplicate hash should have thrown DUPLICATE_QUESTION_HASH error');
    console.log('✅ GENQ-002: Duplicate hash rejection successful.');

  } catch (error) {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  } finally {
    // Cleanup the test data
    await prisma.generatedQuestion.deleteMany({ where: { questionHash: 'HASH_123' }});
    await prisma.$disconnect();
    console.log('--- All tests passed! ---');
  }
}

runTests();
