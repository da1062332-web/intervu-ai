import { PrismaClient, DifficultyLevel, GenerationStrategy } from "@prisma/client";

const prisma = new PrismaClient();

async function remediateCauseEffect() {
  console.log("=================================================");
  console.log("  REMEDIATING CAUSE & EFFECT TEMPLATES & QUESTIONS");
  console.log("=================================================\n");

  // 1. Get Topic
  const topic = await prisma.topic.findFirst({
    where: {
      OR: [
        { code: "CAUSE_EFFECT" },
        { name: { contains: "Cause", mode: "insensitive" } }
      ]
    },
    include: { concepts: true }
  });

  if (!topic) {
    console.error("❌ Cause & Effect topic not found in database!");
    return;
  }

  console.log(`Found Topic: ${topic.name} (${topic.code}, ID: ${topic.id})`);
  const conceptCodes = topic.concepts.map(c => c.code);
  conceptCodes.push(topic.code);
  console.log("Associated Concept Codes:", conceptCodes);

  // 2. Define Comprehensive Templates to Upsert
  const templatesToUpsert = [
    // --- CAUSE-EFFECT_RELATIONSHIP Templates ---
    {
      templateKey: "CAUSE_EFFECT_REL_EASY_001",
      name: "Cause Effect Relationship Analysis (Easy)",
      conceptKey: "CAUSE-EFFECT_RELATIONSHIP",
      difficultyLevel: DifficultyLevel.EASY,
      difficulty: "EASY",
      questionType: "MULTIPLE_CHOICE",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Identify direct cause and effect between two simple statements",
      isActive: true,
      structure: {
        instructions: "Read the two statements and determine the logical relationship between them.",
        questionTemplate: "**Statement I:** {{statement_1}}\n\n**Statement II:** {{statement_2}}\n\nWhich of the following is true?",
        optionsTemplate: [
          "Statement I is the cause and Statement II is its effect.",
          "Statement II is the cause and Statement I is its effect.",
          "Both statements are independent causes.",
          "Both statements are effects of independent causes."
        ]
      },
      variableSchema: { variables: [] },
      constraints: { excludeDuplicates: true },
      solutionSchema: {
        correctAnswer: "Statement I is the cause and Statement II is its effect.",
        steps: ["Analyze if Statement I acts as the direct trigger or cause for Statement II."]
      },
      config: { topics: [topic.id] }
    },
    {
      templateKey: "CAUSE_EFFECT_REL_MED_001",
      name: "Cause Effect Relationship Analysis (Medium)",
      conceptKey: "CAUSE-EFFECT_RELATIONSHIP",
      difficultyLevel: DifficultyLevel.MEDIUM,
      difficulty: "MEDIUM",
      questionType: "MULTIPLE_CHOICE",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Analyze logical direction and interdependence between two statements",
      isActive: true,
      structure: {
        instructions: "Read the two statements and determine the logical relationship between them.",
        questionTemplate: "**Statement I:** {{statement_1}}\n\n**Statement II:** {{statement_2}}\n\nWhich of the following best describes the relationship?",
        optionsTemplate: [
          "Statement I is the cause and Statement II is its effect.",
          "Statement II is the cause and Statement I is its effect.",
          "Both statements are independent causes.",
          "Both statements are effects of independent causes."
        ]
      },
      variableSchema: { variables: [] },
      constraints: { excludeDuplicates: true },
      solutionSchema: {
        correctAnswer: "Statement I is the cause and Statement II is its effect.",
        steps: ["Determine whether one event precedes and logically causes the other event."]
      },
      config: { topics: [topic.id] }
    },
    {
      templateKey: "CAUSE_EFFECT_REL_HARD_001",
      name: "Cause Effect Relationship Analysis (Hard)",
      conceptKey: "CAUSE-EFFECT_RELATIONSHIP",
      difficultyLevel: DifficultyLevel.HARD,
      difficulty: "HARD",
      questionType: "MULTIPLE_CHOICE",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Complex deduction of underlying causes and systemic effects",
      isActive: true,
      structure: {
        instructions: "Evaluate the scenario statements and choose the authoritative cause-effect relationship.",
        questionTemplate: "**Statement I:** {{statement_1}}\n\n**Statement II:** {{statement_2}}\n\nDetermine the correct logical relationship:",
        optionsTemplate: [
          "Statement I is the cause and Statement II is its effect.",
          "Statement II is the cause and Statement I is its effect.",
          "Both statements are independent causes.",
          "Both statements are effects of independent causes."
        ]
      },
      variableSchema: { variables: [] },
      constraints: { excludeDuplicates: true },
      solutionSchema: {
        correctAnswer: "Statement I is the cause and Statement II is its effect.",
        steps: ["Evaluate common root causes vs direct cause-effect linkage."]
      },
      config: { topics: [topic.id] }
    },

    // --- IDENTIFYING_CAUSE Templates ---
    {
      templateKey: "IDENTIFYING_CAUSE_EASY_001",
      name: "Cause Identification (Easy)",
      conceptKey: "IDENTIFYING_CAUSE",
      difficultyLevel: DifficultyLevel.EASY,
      difficulty: "EASY",
      questionType: "MULTIPLE_CHOICE",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Identify the primary cause for a given effect",
      isActive: true,
      structure: {
        instructions: "Identify the event that directly caused the stated outcome.",
        questionTemplate: "{{scenario_text}}\n\nWhat was the primary cause of {{outcome_text}}?",
        optionsTemplate: [
          "{{correct_cause}}",
          "{{distractor_cause_1}}",
          "{{distractor_cause_2}}",
          "{{distractor_cause_3}}"
        ]
      },
      variableSchema: { variables: [] },
      constraints: { excludeDuplicates: true },
      solutionSchema: {
        correctAnswer: "{{correct_cause}}",
        steps: ["Identify the antecedent event directly leading to the outcome."]
      },
      config: { topics: [topic.id] }
    },
    {
      templateKey: "IDENTIFYING_CAUSE_MED_001",
      name: "Cause Identification (Medium)",
      conceptKey: "IDENTIFYING_CAUSE",
      difficultyLevel: DifficultyLevel.MEDIUM,
      difficulty: "MEDIUM",
      questionType: "MULTIPLE_CHOICE",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Determine the root cause among competing factors",
      isActive: true,
      structure: {
        instructions: "Analyze the situation and determine the root cause.",
        questionTemplate: "{{scenario_text}}\n\nWhich of the following serves as the primary cause?",
        optionsTemplate: [
          "{{correct_cause}}",
          "{{distractor_cause_1}}",
          "{{distractor_cause_2}}",
          "{{distractor_cause_3}}"
        ]
      },
      variableSchema: { variables: [] },
      constraints: { excludeDuplicates: true },
      solutionSchema: {
        correctAnswer: "{{correct_cause}}",
        steps: ["Isolate the necessary and sufficient trigger."]
      },
      config: { topics: [topic.id] }
    },
    {
      templateKey: "IDENTIFYING_CAUSE_HARD_001",
      name: "Cause Identification (Hard)",
      conceptKey: "IDENTIFYING_CAUSE",
      difficultyLevel: DifficultyLevel.HARD,
      difficulty: "HARD",
      questionType: "MULTIPLE_CHOICE",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Complex multi-variable root cause deduction",
      isActive: true,
      structure: {
        instructions: "Determine the main driving factor responsible for the observed change.",
        questionTemplate: "{{scenario_text}}\n\nWhich factor is the definitive cause of the observed results?",
        optionsTemplate: [
          "{{correct_cause}}",
          "{{distractor_cause_1}}",
          "{{distractor_cause_2}}",
          "{{distractor_cause_3}}"
        ]
      },
      variableSchema: { variables: [] },
      constraints: { excludeDuplicates: true },
      solutionSchema: {
        correctAnswer: "{{correct_cause}}",
        steps: ["Evaluate contributing vs essential causal factors."]
      },
      config: { topics: [topic.id] }
    },

    // --- IDENTIFYING_EFFECT Templates ---
    {
      templateKey: "IDENTIFYING_EFFECT_EASY_001",
      name: "Effect Identification (Easy)",
      conceptKey: "IDENTIFYING_EFFECT",
      difficultyLevel: DifficultyLevel.EASY,
      difficulty: "EASY",
      questionType: "MULTIPLE_CHOICE",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Identify the direct effect of a given cause",
      isActive: true,
      structure: {
        instructions: "Determine the immediate effect of the stated action.",
        questionTemplate: "{{action_text}}\n\nWhat is the direct effect of this action?",
        optionsTemplate: [
          "{{correct_effect}}",
          "{{distractor_effect_1}}",
          "{{distractor_effect_2}}",
          "{{distractor_effect_3}}"
        ]
      },
      variableSchema: { variables: [] },
      constraints: { excludeDuplicates: true },
      solutionSchema: {
        correctAnswer: "{{correct_effect}}",
        steps: ["Trace the immediate logical outcome."]
      },
      config: { topics: [topic.id] }
    },
    {
      templateKey: "IDENTIFYING_EFFECT_MED_001",
      name: "Effect Identification (Medium)",
      conceptKey: "IDENTIFYING_EFFECT",
      difficultyLevel: DifficultyLevel.MEDIUM,
      difficulty: "MEDIUM",
      questionType: "MULTIPLE_CHOICE",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Identify secondary or broader consequences of an event",
      isActive: true,
      structure: {
        instructions: "Analyze the cause and determine its principal effect.",
        questionTemplate: "{{action_text}}\n\nWhich outcome is most likely to follow as a result?",
        optionsTemplate: [
          "{{correct_effect}}",
          "{{distractor_effect_1}}",
          "{{distractor_effect_2}}",
          "{{distractor_effect_3}}"
        ]
      },
      variableSchema: { variables: [] },
      constraints: { excludeDuplicates: true },
      solutionSchema: {
        correctAnswer: "{{correct_effect}}",
        steps: ["Evaluate logical downstream consequences."]
      },
      config: { topics: [topic.id] }
    },
    {
      templateKey: "IDENTIFYING_EFFECT_HARD_001",
      name: "Effect Identification (Hard)",
      conceptKey: "IDENTIFYING_EFFECT",
      difficultyLevel: DifficultyLevel.HARD,
      difficulty: "HARD",
      questionType: "MULTIPLE_CHOICE",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Deduce long-term or multi-step consequences",
      isActive: true,
      structure: {
        instructions: "Deduce the ultimate systemic effect of the given event.",
        questionTemplate: "{{action_text}}\n\nWhat is the primary long-term impact of this event?",
        optionsTemplate: [
          "{{correct_effect}}",
          "{{distractor_effect_1}}",
          "{{distractor_effect_2}}",
          "{{distractor_effect_3}}"
        ]
      },
      variableSchema: { variables: [] },
      constraints: { excludeDuplicates: true },
      solutionSchema: {
        correctAnswer: "{{correct_effect}}",
        steps: ["Analyze structural cascade effects."]
      },
      config: { topics: [topic.id] }
    },

    // --- CAUSE_EFFECT Topic Fallback Templates ---
    {
      templateKey: "CAUSE_EFFECT_TOPIC_EASY_001",
      name: "Cause & Effect General (Easy)",
      conceptKey: "CAUSE_EFFECT",
      difficultyLevel: DifficultyLevel.EASY,
      difficulty: "EASY",
      questionType: "MULTIPLE_CHOICE",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "General Cause & Effect relationship evaluation",
      isActive: true,
      structure: {
        instructions: "Read the statements and determine the cause-effect relationship.",
        questionTemplate: "**Statement I:** {{statement_1}}\n\n**Statement II:** {{statement_2}}\n\nWhich of the following is true?",
        optionsTemplate: [
          "Statement I is the cause and Statement II is its effect.",
          "Statement II is the cause and Statement I is its effect.",
          "Both statements are independent causes.",
          "Both statements are effects of independent causes."
        ]
      },
      variableSchema: { variables: [] },
      constraints: { excludeDuplicates: true },
      solutionSchema: {
        correctAnswer: "Statement I is the cause and Statement II is its effect.",
        steps: ["Identify cause vs effect between Statement I and Statement II."]
      },
      config: { topics: [topic.id] }
    },
    {
      templateKey: "CAUSE_EFFECT_TOPIC_MED_001",
      name: "Cause & Effect General (Medium)",
      conceptKey: "CAUSE_EFFECT",
      difficultyLevel: DifficultyLevel.MEDIUM,
      difficulty: "MEDIUM",
      questionType: "MULTIPLE_CHOICE",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "General Cause & Effect relationship evaluation",
      isActive: true,
      structure: {
        instructions: "Read the statements and determine the cause-effect relationship.",
        questionTemplate: "**Statement I:** {{statement_1}}\n\n**Statement II:** {{statement_2}}\n\nWhich of the following is true?",
        optionsTemplate: [
          "Statement I is the cause and Statement II is its effect.",
          "Statement II is the cause and Statement I is its effect.",
          "Both statements are independent causes.",
          "Both statements are effects of independent causes."
        ]
      },
      variableSchema: { variables: [] },
      constraints: { excludeDuplicates: true },
      solutionSchema: {
        correctAnswer: "Statement I is the cause and Statement II is its effect.",
        steps: ["Identify cause vs effect between Statement I and Statement II."]
      },
      config: { topics: [topic.id] }
    },
    {
      templateKey: "CAUSE_EFFECT_TOPIC_HARD_001",
      name: "Cause & Effect General (Hard)",
      conceptKey: "CAUSE_EFFECT",
      difficultyLevel: DifficultyLevel.HARD,
      difficulty: "HARD",
      questionType: "MULTIPLE_CHOICE",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "General Cause & Effect relationship evaluation",
      isActive: true,
      structure: {
        instructions: "Read the statements and determine the cause-effect relationship.",
        questionTemplate: "**Statement I:** {{statement_1}}\n\n**Statement II:** {{statement_2}}\n\nWhich of the following is true?",
        optionsTemplate: [
          "Statement I is the cause and Statement II is its effect.",
          "Statement II is the cause and Statement I is its effect.",
          "Both statements are independent causes.",
          "Both statements are effects of independent causes."
        ]
      },
      variableSchema: { variables: [] },
      constraints: { excludeDuplicates: true },
      solutionSchema: {
        correctAnswer: "Statement I is the cause and Statement II is its effect.",
        steps: ["Identify cause vs effect between Statement I and Statement II."]
      },
      config: { topics: [topic.id] }
    }
  ];

  let upsertedCount = 0;
  const createdTemplateMap: Record<string, string> = {};

  for (const t of templatesToUpsert) {
    const existing = await prisma.template.findFirst({
      where: { templateKey: t.templateKey }
    });

    if (existing) {
      const updated = await prisma.template.update({
        where: { id: existing.id },
        data: t as any
      });
      createdTemplateMap[`${t.conceptKey}_${t.difficultyLevel}`] = updated.id;
      upsertedCount++;
    } else {
      const created = await prisma.template.create({
        data: t as any
      });
      createdTemplateMap[`${t.conceptKey}_${t.difficultyLevel}`] = created.id;
      upsertedCount++;
    }
  }

  console.log(`\n✅ Upserted ${upsertedCount} Cause & Effect templates into the database.`);

  // 3. Remediate all existing Question records for Cause & Effect
  const questions = await prisma.question.findMany({
    where: {
      OR: [
        { topicId: topic.id },
        { topic: { code: "CAUSE_EFFECT" } },
        { topic: { name: { contains: "Cause", mode: "insensitive" } } }
      ]
    }
  });

  console.log(`\nRemediating ${questions.length} existing Cause & Effect questions...`);

  const standardOptions = [
    "Statement I is the cause and Statement II is its effect.",
    "Statement II is the cause and Statement I is its effect.",
    "Both statements are independent causes.",
    "Both statements are effects of independent causes."
  ];

  let remediatedQuestionsCount = 0;

  for (const q of questions) {
    let text = q.questionText || "";
    let answer = q.answer || "";
    const mcq: any = q.mcqData || {};
    const meta: any = q.metadata || {};

    // Standardize answer string formatting (trailing period matching)
    if (answer && !answer.endsWith(".")) {
      answer = answer + ".";
    }

    // Match answer to standard option
    let matchedOption = standardOptions.find(
      opt => opt.toLowerCase().trim() === answer.toLowerCase().trim() ||
             opt.toLowerCase().replace(/\./g, "").trim() === answer.toLowerCase().replace(/\./g, "").trim()
    );

    if (!matchedOption) {
      matchedOption = standardOptions[0]; // fallback
      answer = matchedOption;
    } else {
      answer = matchedOption;
    }

    // Format options array
    const options = [...standardOptions];
    mcq.options = options;
    mcq.correctAnswer = answer;

    meta.options = options;
    meta.topicCode = "CAUSE_EFFECT";
    meta.conceptCode = meta.conceptCode || "CAUSE-EFFECT_RELATIONSHIP";
    meta.strategy = meta.strategy || "VARIABLE";

    // Attach valid templateId if missing
    const templateKey = createdTemplateMap[`CAUSE-EFFECT_RELATIONSHIP_${q.difficulty}`] ||
                        createdTemplateMap[`CAUSE_EFFECT_${q.difficulty}`];
    
    if (templateKey) {
      q.templateId = templateKey;
    }

    await prisma.question.update({
      where: { id: q.id },
      data: {
        questionText: text,
        answer: answer,
        mcqData: mcq,
        metadata: meta,
        templateId: q.templateId,
        status: "ACTIVE"
      }
    });

    remediatedQuestionsCount++;
    console.log(`  - Fixed Q [${q.id}] (${q.difficulty}): Answer="${answer}"`);
  }

  console.log(`\n=================================================`);
  console.log(`✅ Remediated ${remediatedQuestionsCount} Cause & Effect questions.`);
  console.log(`=================================================\n`);
}

remediateCauseEffect().catch(console.error).finally(() => prisma.$disconnect());
