import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding mock workflow for testing...');

  // 1. Ensure an ExamConfig exists
  let examConfig = await prisma.examConfig.findFirst();
  if (!examConfig) {
    examConfig = await prisma.examConfig.create({
      data: {
        title: 'Mock Frontend Developer Exam',
        description: 'A mock exam to test the workflow dashboard.',
        timeLimit: 60,
        passingScore: 70,
        status: 'DRAFT',
      },
    });
    console.log(`Created new ExamConfig: ${examConfig.id}`);
  } else {
    console.log(`Using existing ExamConfig: ${examConfig.id}`);
  }

  // 2. Ensure an ExamWorkflow exists for it
  let workflow = await prisma.examWorkflow.findUnique({
    where: { examId: examConfig.id },
  });

  if (!workflow) {
    workflow = await prisma.examWorkflow.create({
      data: {
        examId: examConfig.id,
        currentStep: 'CONFIGURATION',
        status: 'IN_PROGRESS',
        completionPercentage: 25,
      },
    });
    console.log(`Created new ExamWorkflow: ${workflow.id}`);
  } else {
    workflow = await prisma.examWorkflow.update({
      where: { id: workflow.id },
      data: {
        currentStep: 'CONFIGURATION',
        status: 'IN_PROGRESS',
        completionPercentage: 25,
      },
    });
    console.log(`Updated existing ExamWorkflow: ${workflow.id}`);
  }

  // 3. Create another workflow in REVIEW status
  let config2 = await prisma.examConfig.findFirst({
    where: { name: 'Mock Backend Developer Exam' }
  });

  if (!config2) {
    config2 = await prisma.examConfig.create({
      data: {
        name: 'Mock Backend Developer Exam',
        role: 'Backend Developer',
        description: 'A mock exam for backend.',
        durationMinutes: 90,
        totalQuestions: 40,
        status: 'DRAFT',
        code: 'BDE-01'
      },
    });
  }

  await prisma.examWorkflow.upsert({
    where: { examId: config2.id },
    update: {
      currentStep: 'QUESTION_REVIEW',
      status: 'IN_PROGRESS',
      completionPercentage: 60,
    },
    create: {
      examId: config2.id,
      currentStep: 'QUESTION_REVIEW',
      status: 'IN_PROGRESS',
      completionPercentage: 60,
    }
  });
  console.log('Created REVIEW_QUESTIONS workflow');

  // 4. Create a completed workflow
  let config3 = await prisma.examConfig.findFirst({
    where: { name: 'Mock DevOps Exam' }
  });

  if (!config3) {
    config3 = await prisma.examConfig.create({
      data: {
        name: 'Mock DevOps Exam',
        role: 'DevOps Engineer',
        description: 'A mock exam for devops.',
        durationMinutes: 120,
        totalQuestions: 50,
        status: 'PUBLISHED',
        code: 'DEV-01'
      },
    });
  }

  await prisma.examWorkflow.upsert({
    where: { examId: config3.id },
    update: {
      currentStep: 'PUBLISHING',
      status: 'COMPLETED',
      completionPercentage: 100,
    },
    create: {
      examId: config3.id,
      currentStep: 'PUBLISHING',
      status: 'COMPLETED',
      completionPercentage: 100,
    }
  });
  console.log('Created COMPLETED workflow');

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
