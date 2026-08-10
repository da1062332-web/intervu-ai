import { PrismaClient, DifficultyLevel } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

const prisma = new PrismaClient();

async function seedAssessment() {
  console.log("=== SEEDING ASSESSMENT DATA ===");
  try {
    // 1. Create a Candidate User
    const user = await prisma.user.create({
      data: {
        email: `candidate_seed_${Date.now()}@example.com`,
        passwordHash: "dummyhash",
        fullName: "Jane Doe Candidate",
        role: "CANDIDATE",
      },
    });
    console.log(`✅ Created candidate user: ${user.email}`);

    // 2. Create Template
    const template = await prisma.template.create({
      data: {
        templateKey: `tpl_seed_${Date.now()}`,
        conceptKey: "javascript_basics",
        difficultyLevel: DifficultyLevel.MEDIUM,
        questionType: "mcq",
        name: "JavaScript Basics MCQ",
      },
    });
    console.log(`✅ Created template: ${template.name}`);

    // 3. Generate Questions and Options
    const questionsToSeed = [
      {
        questionId: createId(),
        questionText: "What does 'typeof null' return in JavaScript?",
        options: ["'null'", "'undefined'", "'object'", "'string'"],
        correctAnswer: "'object'",
        solution: JSON.stringify({
          steps: [
            "In JavaScript, typeof null is a known historical bug that returns 'object'.",
          ],
          finalAnswer: "'object'",
        }),
      },
      {
        questionId: createId(),
        questionText:
          "Which keyword is used to declare a block-scoped variable?",
        options: ["var", "let", "function", "global"],
        correctAnswer: "let",
        solution: JSON.stringify({
          steps: [
            "The 'let' keyword allows you to declare variables that are limited to a scope of a block statement, or expression.",
          ],
          finalAnswer: "let",
        }),
      },
    ];

    for (const q of questionsToSeed) {
      await prisma.generatedQuestion.create({
        data: {
          id: q.questionId,
          templateId: template.id,
          questionHash: `hash_${q.questionId}`,
          conceptKey: template.conceptKey,
          difficultyLevel: "MEDIUM",
          questionType: template.questionType,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          solution: q.solution,
          metadata: { tags: ["javascript", "frontend"] },
        },
      });
      console.log(
        `✅ Created question: "${q.questionText}" with ${q.options.length} options`,
      );
    }

    // 4. Create Assessment Configuration (TestConfig & TestSection)
    const testConfig = await prisma.testConfig.create({
      data: {
        configKey: `cfg_seed_${Date.now()}`,
        companyName: "Tech Corp Inc.",
        displayName: "Frontend Developer Assessment",
        totalDurationSeconds: 1800, // 30 minutes
        totalQuestions: 2,
      },
    });
    console.log(
      `✅ Created assessment (TestConfig): ${testConfig.displayName}`,
    );

    const testSection = await prisma.testSection.create({
      data: {
        testConfigId: testConfig.id,
        sectionKey: "javascript_basics",
        displayName: "JavaScript Basics Section",
        durationSeconds: 1800,
        questionCount: 2,
        orderIndex: 0,
      },
    });
    console.log(`✅ Created assessment section: ${testSection.displayName}`);

    // 5. Create ExamConfig, ExamSection, Topic, and Question to link to Template
    const examConfig = await prisma.examConfig.create({
      data: {
        code: `EXAM_${Date.now()}`,
        name: "JavaScript Master Exam",
        role: "Frontend Developer",
        durationMinutes: 60,
        totalQuestions: 1,
        isActive: true,
      },
    });
    console.log(`✅ Created ExamConfig: ${examConfig.name}`);

    const examSection = await prisma.examSection.create({
      data: {
        examConfigId: examConfig.id,
        name: "Core JS",
        code: `SEC_${Date.now()}`,
        questionCount: 1,
        sectionDurationMinutes: 60,
        sectionOrder: 1,
      },
    });
    console.log(`✅ Created ExamSection: ${examSection.name}`);

    const topic = await prisma.topic.create({
      data: {
        name: "JavaScript Basics",
        code: `TOPIC_${Date.now()}`,
      },
    });
    console.log(`✅ Created Topic: ${topic.name}`);

    const question = await prisma.question.create({
      data: {
        questionText: "What does 'typeof null' return in JavaScript?",
        answer: "'object'",
        explanation:
          "In JavaScript, typeof null is a known historical bug that returns 'object'.",
        topicId: topic.id,
        sectionId: examSection.id,
        difficulty: "MEDIUM",
        source: "seed",
        templateId: template.id,
      },
    });
    console.log(`✅ Created Question linked to ExamConfig and Template!`);

    console.log("=== SEEDING COMPLETED SUCCESSFULLY ===");
  } catch (error) {
    console.error("❌ Error seeding assessment data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAssessment();
