import { PrismaClient, DifficultyLevel, ConfigStatus, TopicStatus, ConceptStatus, VariableType, RuleType } from "@prisma/client";

export async function seedModule1QA(prisma: PrismaClient) {
  console.log("Seeding Module 1 QA Data...");

  // 1. Topic & Concept
  const topicCode = "QA_VALIDATION_TOPIC";
  const topic = await prisma.topic.upsert({
    where: { code: topicCode },
    update: { name: "QA Validation Topic", status: TopicStatus.ACTIVE },
    create: {
      name: "QA Validation Topic",
      code: topicCode,
      description: "Testing domain topic mapping",
      status: TopicStatus.ACTIVE,
    },
  });

  const conceptCode = "QA_VALIDATION_CONCEPT";
  const concept = await prisma.concept.upsert({
    where: {
      topicId_code: {
        topicId: topic.id,
        code: conceptCode,
      },
    },
    update: { name: "QA Validation Concept", status: ConceptStatus.ACTIVE },
    create: {
      topicId: topic.id,
      name: "QA Validation Concept",
      code: conceptCode,
      status: ConceptStatus.ACTIVE,
    },
  });

  // 2. Templates (EASY, MEDIUM, HARD) to satisfy blueprint allocations
  const difficulties = [DifficultyLevel.EASY, DifficultyLevel.MEDIUM, DifficultyLevel.HARD];
  const templates = [];

  for (const diff of difficulties) {
    const templateKey = `QA_TEMPLATE_${diff}`;
    const name = `QA Template ${diff}`;

    const t = await prisma.template.upsert({
      where: { templateKey },
      update: {
        conceptKey: conceptCode,
        difficultyLevel: diff,
        isActive: true,
        name,
        questionType: "multiple_choice",
      },
      create: {
        templateKey,
        conceptKey: conceptCode,
        difficultyLevel: diff,
        isActive: true,
        name,
        questionType: "multiple_choice",
        structure: {},
        variableSchema: {},
        constraints: {},
        solutionSchema: {},
      },
    });

    // Template variables
    await prisma.templateVariable.upsert({
      where: {
        templateId_variableName: {
          templateId: t.id,
          variableName: "qa_var",
        },
      },
      update: { variableType: VariableType.NUMBER, required: true, defaultValue: "42" },
      create: {
        templateId: t.id,
        variableName: "qa_var",
        variableType: VariableType.NUMBER,
        required: true,
        defaultValue: "42",
      },
    });

    // Template rules
    const ruleConfig = { variableName: "qa_var", min: 1, max: 100 };
    await prisma.templateRule.upsert({
      where: { id: `QA_RULE_${diff}` },
      update: {
        templateId: t.id,
        ruleType: RuleType.RANGE,
        ruleConfig: ruleConfig,
      },
      create: {
        id: `QA_RULE_${diff}`,
        templateId: t.id,
        ruleType: RuleType.RANGE,
        ruleConfig: ruleConfig,
      },
    });

    // Solution templates
    await prisma.solutionTemplate.upsert({
      where: { templateId: t.id },
      update: {
        solutionTemplate: "return qa_var;",
        explanationTemplate: "Just returns the variable.",
      },
      create: {
        templateId: t.id,
        solutionTemplate: "return qa_var;",
        explanationTemplate: "Just returns the variable.",
      },
    });

    templates.push(t);
  }

  // 3. Style Profile
  // Check if standard Experienced Hiring style profile exists, or create one for E2E tests
  let styleProfile = await prisma.styleProfile.findFirst({
    where: { name: "Experienced Hiring" },
  });

  if (!styleProfile) {
    styleProfile = await prisma.styleProfile.create({
      data: {
        name: "Experienced Hiring",
        description: "Lateral assessment style profile",
        profileType: "lateral",
        active: true,
      },
    });
    // Characteristics
    const characteristics = [
      { name: "questionLength", value: "long" },
      { name: "complexity", value: "high" },
      { name: "scenarioUsage", value: 0.7 },
      { name: "codeIntensity", value: 0.8 },
      { name: "theoryWeight", value: 20 },
      { name: "practicalWeight", value: 80 },
      { name: "difficultyBias", value: { easy: 20, medium: 50, hard: 30 } },
    ];
    for (const char of characteristics) {
      await prisma.styleProfileCharacteristic.create({
        data: {
          profileId: styleProfile.id,
          characteristicName: char.name,
          characteristicValue: char.value,
        },
      });
    }
  }

  // 4. Exam Config
  const configCode = "QA_SYS_VALIDATION";
  const examConfig = await prisma.examConfig.upsert({
    where: { code: configCode },
    update: {
      name: "QA Validation Config",
      role: "QA Engineer",
      durationMinutes: 60,
      totalQuestions: 10,
      status: ConfigStatus.ACTIVE,
      isActive: true,
      isArchived: false,
    },
    create: {
      name: "QA Validation Config",
      code: configCode,
      role: "QA Engineer",
      durationMinutes: 60,
      totalQuestions: 10,
      status: ConfigStatus.ACTIVE,
      isActive: true,
      isArchived: false,
    },
  });

  // Rule flags
  await prisma.ruleFlags.upsert({
    where: { examConfigId: examConfig.id },
    update: {
      negativeMarkingEnabled: false,
      sectionalCutoffEnabled: false,
      adaptiveDifficultyEnabled: false,
      shuffleQuestionsEnabled: true,
      shuffleOptionsEnabled: true,
      allowSectionNavigation: true,
    },
    create: {
      examConfigId: examConfig.id,
      negativeMarkingEnabled: false,
      sectionalCutoffEnabled: false,
      adaptiveDifficultyEnabled: false,
      shuffleQuestionsEnabled: true,
      shuffleOptionsEnabled: true,
      allowSectionNavigation: true,
    },
  });

  // Difficulty Distribution
  await prisma.difficultyDistribution.upsert({
    where: { examConfigId: examConfig.id },
    update: {
      easyPercentage: 30,
      mediumPercentage: 50,
      hardPercentage: 20,
    },
    create: {
      examConfigId: examConfig.id,
      easyPercentage: 30,
      mediumPercentage: 50,
      hardPercentage: 20,
    },
  });

  // Exam Section
  const sectionCode = "QA_SECTION";
  const section = await prisma.examSection.upsert({
    where: {
      examConfigId_code: {
        examConfigId: examConfig.id,
        code: sectionCode,
      },
    },
    update: {
      name: "QA Section",
      questionCount: 10,
      sectionDurationMinutes: 60,
      sectionOrder: 1,
      isRequired: true,
    },
    create: {
      examConfigId: examConfig.id,
      name: "QA Section",
      code: sectionCode,
      questionCount: 10,
      sectionDurationMinutes: 60,
      sectionOrder: 1,
      isRequired: true,
    },
  });

  // 5. Section Topic Mapping & Weightage
  const sectionTopic = await prisma.sectionTopic.upsert({
    where: {
      sectionId_topicId: {
        sectionId: section.id,
        topicId: topic.id,
      },
    },
    update: {},
    create: {
      sectionId: section.id,
      topicId: topic.id,
    },
  });

  await prisma.topicWeightage.upsert({
    where: {
      sectionId_topicId: {
        sectionId: section.id,
        topicId: topic.id,
      },
    },
    update: { weightagePercentage: 100 },
    create: {
      sectionId: section.id,
      topicId: topic.id,
      weightagePercentage: 100,
    },
  });

  // 6. Blueprint
  const sectionsJson = [
    {
      sectionId: section.code,
      questionCount: 10,
      difficultyAllocation: { easy: 30, medium: 50, hard: 20 },
      topicAllocations: [
        { topicId: topic.id, percentage: 100 }
      ]
    }
  ];

  await prisma.blueprint.upsert({
    where: { configId: examConfig.id },
    update: {
      styleProfileId: styleProfile.id,
      sections: sectionsJson,
    },
    create: {
      configId: examConfig.id,
      styleProfileId: styleProfile.id,
      sections: sectionsJson,
    },
  });

  console.log("Module 1 QA Data seeded successfully.");
}
