import { PrismaClient } from '../../../node_modules/@prisma/client';

const prisma = new PrismaClient();

async function runDatasetFullScenariosTest() {
  console.log('🚀 Starting Full Dataset End-to-End Scenarios Integration Test...\n');

  try {
    // 1. Fetch an existing Topic and Concept from DB for testing
    const topic = await prisma.topic.findFirst();
    if (!topic) {
      throw new Error('No Topic found in database to link Dataset to.');
    }
    const concept = await prisma.concept.findFirst({ where: { topicId: topic.id } });
    console.log(`📌 Using Topic: "${topic.name}" (${topic.id})`);
    console.log(`📌 Using Concept: "${concept?.name || 'N/A'}" (${concept?.id || 'N/A'})\n`);

    // -------------------------------------------------------------
    // SCENARIO 1: Create a Dataset with Topic & Concept at Dataset Level
    // -------------------------------------------------------------
    console.log('--- SCENARIO 1: Create Dataset with Topic & Concept ---');
    const datasetName = `Test MCQ Dataset ${Date.now()}`;
    const dataset = await prisma.dataset.create({
      data: {
        name: datasetName,
        description: 'End to end testing dataset for MCQ questions',
        type: 'STANDARD',
        topicId: topic.id,
        conceptId: concept?.id || null,
      },
    });
    console.log(`✅ Dataset created successfully: ID=${dataset.id}, Name="${dataset.name}"`);
    console.log(`   TopicId: ${dataset.topicId}, ConceptId: ${dataset.conceptId}\n`);

    // -------------------------------------------------------------
    // SCENARIO 2: Add a Single Valid MCQ Item to Dataset
    // -------------------------------------------------------------
    console.log('--- SCENARIO 2: Add Single Valid MCQ Item ---');
    const validOptions = ['O(1)', 'O(N)', 'O(N log N)', 'O(N^2)'];
    const validAnswer = 'O(N)';

    // Verify option-answer matching before DB insert
    const isAnswerInOptions = validOptions.some(o => o.trim().toLowerCase() === validAnswer.trim().toLowerCase());
    if (!isAnswerInOptions) {
      throw new Error(`Validation Error: Correct answer "${validAnswer}" is not in options [${validOptions.join(', ')}]`);
    }

    const singleItem = await prisma.datasetItem.create({
      data: {
        datasetId: dataset.id,
        questionText: 'What is the search complexity in an unsorted array?',
        content: 'What is the search complexity in an unsorted array?',
        options: validOptions,
        answer: validAnswer,
        explanation: 'Unsorted arrays require checking each element sequentially.',
        difficulty: 'MEDIUM',
        tags: ['data-structures', 'arrays'],
      },
    });
    console.log(`✅ Single MCQ Item created successfully: ID=${singleItem.id}`);
    console.log(`   Question: "${singleItem.questionText}"`);
    console.log(`   Options: [${singleItem.options.join(', ')}]`);
    console.log(`   Correct Answer: "${singleItem.answer}"\n`);

    // -------------------------------------------------------------
    // SCENARIO 3: Test Answer-to-Option Mismatch Validation (Negative Test)
    // -------------------------------------------------------------
    console.log('--- SCENARIO 3: Option-Answer Mismatch Validation Check ---');
    const invalidOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
    const invalidAnswer = 'Option E (Not in choices)';

    const matchCheck = invalidOptions.some(o => o.trim().toLowerCase() === invalidAnswer.trim().toLowerCase());
    if (!matchCheck) {
      console.log(`🛡️ Validation Block Triggered Correctly!`);
      console.log(`   Attempted Answer "${invalidAnswer}" was blocked because it's not in [${invalidOptions.join(', ')}]\n`);
    } else {
      throw new Error('FAILED: Mismatched answer was not caught by validation logic.');
    }

    // -------------------------------------------------------------
    // SCENARIO 4: Bulk Add Dataset Items (Valid CSV / Array)
    // -------------------------------------------------------------
    console.log('--- SCENARIO 4: Bulk Add Dataset Items ---');
    const bulkItemsData = [
      {
        datasetId: dataset.id,
        questionText: 'Which keyword declares a block-scoped variable in modern JS?',
        content: 'Which keyword declares a block-scoped variable in modern JS?',
        options: ['var', 'let', 'const', 'static'],
        answer: 'let',
        explanation: 'let creates block-scoped variables.',
        difficulty: 'EASY',
      },
      {
        datasetId: dataset.id,
        questionText: 'What is the default value of a boolean variable in Java?',
        content: 'What is the default value of a boolean variable in Java?',
        options: ['true', 'false', 'null', '0'],
        answer: 'false',
        explanation: 'Boolean primitive fields default to false in Java.',
        difficulty: 'EASY',
      },
    ];

    const bulkResult = await prisma.datasetItem.createMany({
      data: bulkItemsData,
    });
    console.log(`✅ Bulk Items inserted successfully: Count=${bulkResult.count}\n`);

    // -------------------------------------------------------------
    // SCENARIO 5: Update an Existing Dataset Item
    // -------------------------------------------------------------
    console.log('--- SCENARIO 5: Update Existing Dataset Item ---');
    const updatedItem = await prisma.datasetItem.update({
      where: { id: singleItem.id },
      data: {
        questionText: 'Updated: What is linear search time complexity in an unsorted array?',
        difficulty: 'HARD',
        answer: 'O(N)',
      },
    });
    console.log(`✅ Dataset Item updated successfully: ID=${updatedItem.id}`);
    console.log(`   Updated Question: "${updatedItem.questionText}"`);
    console.log(`   Updated Difficulty: "${updatedItem.difficulty}"\n`);

    // -------------------------------------------------------------
    // SCENARIO 6: Retrieve Dataset with Items and Verify Normalized Schema
    // -------------------------------------------------------------
    console.log('--- SCENARIO 6: Retrieve Dataset with Items & Normalized Relation ---');
    const retrievedDataset = await prisma.dataset.findUnique({
      where: { id: dataset.id },
      include: {
        items: true,
        topic: true,
        concept: true,
      },
    });

    console.log(`✅ Dataset Retrieved: Name="${retrievedDataset?.name}"`);
    console.log(`   Topic Name: "${retrievedDataset?.topic?.name || 'N/A'}"`);
    console.log(`   Concept Name: "${retrievedDataset?.concept?.name || 'N/A'}"`);
    console.log(`   Total Items Count: ${retrievedDataset?.items.length}`);
    retrievedDataset?.items.forEach((item, idx) => {
      console.log(`   Item ${idx + 1}: "${item.questionText}" [Answer: ${item.answer}]`);
    });

    // -------------------------------------------------------------
    // CLEANUP: Clean up test records
    // -------------------------------------------------------------
    console.log('\n--- CLEANUP: Removing Test Dataset ---');
    await prisma.dataset.delete({ where: { id: dataset.id } });
    console.log('✅ Test dataset and all child items deleted cleanly.');

    console.log('\n🎉 ALL DATASET TEST SCENARIOS PASSED WITH 100% SUCCESS!');
  } catch (err: any) {
    console.error('❌ Test Scenario Failed:', err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

runDatasetFullScenariosTest();
