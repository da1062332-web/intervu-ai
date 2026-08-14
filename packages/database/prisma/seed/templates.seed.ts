import { PrismaClient, DifficultyLevel, GenerationStrategy } from "@prisma/client";

export async function seedTemplates(prisma: PrismaClient): Promise<void> {
  console.log("Seeding templates...");

  // Delete dependent records to avoid foreign key constraint violations
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Template" CASCADE;');

  const templates = [
    {
      name: "TCS_NQT_NUMERICAL_ABILITY_EASY",
      templateKey: "NUMERICAL_ABILITY_EASY_001",
      conceptKey: "NUMERICAL_ABILITY",
      difficultyLevel: DifficultyLevel.EASY,
      questionType: "multiple_choice",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Basic percentage calculation",
      isActive: true,
      structure: {
        questionTemplate: "What is {{percent}}% of {{amount}}?",
        optionsTemplate: [
          "{{correct_answer}}",
          "{{distractor_1}}",
          "{{distractor_2}}",
          "{{distractor_3}}",
        ],
      },
      variableSchema: {
        variables: [
          { name: "percent", type: "number", min: 5, max: 50, step: 5 },
          { name: "amount", type: "number", min: 100, max: 5000, step: 50 },
        ],
        derived: [
          { name: "correct_answer", formula: "(percent * amount) / 100" },
          { name: "distractor_1", formula: "((percent + 5) * amount) / 100" },
          { name: "distractor_2", formula: "((percent - 5) * amount) / 100" },
          { name: "distractor_3", formula: "(percent * (amount + 100)) / 100" },
        ],
      },
      constraints: { excludeDuplicates: true },
      solutionSchema: {
        correctVariable: "correct_answer",
        steps: ["Multiply percentage by the base amount and divide by 100."],
        finalAnswer: "correct_answer",
      },
    },
    {
      name: "TCS_NQT_NUMERICAL_ABILITY_MEDIUM",
      templateKey: "NUMERICAL_ABILITY_MED_001",
      conceptKey: "NUMERICAL_ABILITY",
      difficultyLevel: DifficultyLevel.MEDIUM,
      questionType: "multiple_choice",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Profit and Loss calculation",
      isActive: true,
      structure: {
        questionTemplate:
          "A shopkeeper purchases an item for Rs. {{cost_price}} and marks it up for sale at a profit of {{profit_percent}}%. What is the final selling price?",
        optionsTemplate: [
          "Rs. {{correct_answer}}",
          "Rs. {{distractor_1}}",
          "Rs. {{distractor_2}}",
          "Rs. {{distractor_3}}",
        ],
      },
      variableSchema: {
        variables: [
          { name: "cost_price", type: "number", min: 200, max: 2000, step: 100 },
          { name: "profit_percent", type: "number", min: 10, max: 30, step: 5 },
        ],
        derived: [
          { name: "correct_answer", formula: "cost_price * (1 + profit_percent / 100)" },
          { name: "distractor_1", formula: "cost_price * (1 + (profit_percent + 5) / 100)" },
          { name: "distractor_2", formula: "cost_price * (1 - profit_percent / 100)" },
          { name: "distractor_3", formula: "cost_price + (profit_percent * 10)" },
        ],
      },
      constraints: { excludeDuplicates: true },
      solutionSchema: {
        correctVariable: "correct_answer",
        steps: [
          "Calculate profit = Cost Price * (Profit% / 100)",
          "Selling Price = Cost Price + Profit",
        ],
        finalAnswer: "correct_answer",
      },
    },
    {
      name: "TCS_NQT_NUMERICAL_ABILITY_HARD",
      templateKey: "NUMERICAL_ABILITY_HARD_001",
      conceptKey: "NUMERICAL_ABILITY",
      difficultyLevel: DifficultyLevel.HARD,
      questionType: "multiple_choice",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Time, Speed and Distance problem",
      isActive: true,
      structure: {
        questionTemplate:
          "A train running at a speed of {{speed}} km/hr crosses a bridge of length {{bridge_len}} meters in {{time_sec}} seconds. What is the length of the train in meters?",
        optionsTemplate: [
          "{{correct_answer}} meters",
          "{{distractor_1}} meters",
          "{{distractor_2}} meters",
          "{{distractor_3}} meters",
        ],
      },
      variableSchema: {
        variables: [
          { name: "speed", type: "number", min: 54, max: 90, step: 18 },
          { name: "time_sec", type: "number", min: 20, max: 40, step: 5 },
          { name: "bridge_len", type: "number", min: 100, max: 300, step: 50 },
        ],
        derived: [
          { name: "speed_mps", formula: "(speed * 5) / 18" },
          { name: "total_dist", formula: "speed_mps * time_sec" },
          { name: "correct_answer", formula: "total_dist - bridge_len" },
          { name: "distractor_1", formula: "total_dist - bridge_len + 50" },
          { name: "distractor_2", formula: "total_dist - bridge_len - 50" },
          { name: "distractor_3", formula: "total_dist" },
        ],
      },
      constraints: { excludeDuplicates: true },
      solutionSchema: {
        correctVariable: "correct_answer",
        steps: [
          "Convert speed from km/hr to m/s: Speed * (5 / 18)",
          "Total distance covered = Speed (m/s) * Time (s)",
          "Train Length = Total Distance - Bridge Length",
        ],
        finalAnswer: "correct_answer",
      },
    },
    {
      name: "TCS_NQT_VERBAL_ABILITY_EASY",
      templateKey: "VERBAL_ABILITY_EASY_001",
      conceptKey: "VERBAL_ABILITY",
      difficultyLevel: DifficultyLevel.EASY,
      questionType: "multiple_choice",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Synonym selection",
      isActive: true,
      structure: {
        questionTemplate: "Choose the word most nearly similar in meaning to {{target_word}}.",
        optionsTemplate: [
          "{{correct_synonym}}",
          "{{antonym_1}}",
          "{{distractor_1}}",
          "{{distractor_2}}",
        ],
      },
      variableSchema: {
        variables: [
          { name: "target_word", type: "string", default: "CANDID" },
          { name: "correct_synonym", type: "string", default: "Frank" },
          { name: "antonym_1", type: "string", default: "Deceptive" },
          { name: "distractor_1", type: "string", default: "Shy" },
          { name: "distractor_2", type: "string", default: "Arrogant" },
        ],
      },
      constraints: {},
      solutionSchema: {
        correctVariable: "correct_synonym",
        steps: ["'Candid' means truthful and straightforward; frank."],
        finalAnswer: "correct_synonym",
      },
    },
    {
      name: "TCS_NQT_VERBAL_ABILITY_MEDIUM",
      templateKey: "VERBAL_ABILITY_MED_001",
      conceptKey: "VERBAL_ABILITY",
      difficultyLevel: DifficultyLevel.MEDIUM,
      questionType: "multiple_choice",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Sentence completion with conjunction",
      isActive: true,
      structure: {
        questionTemplate:
          "Fill in the blank: Although the weather was severe, the expedition team decided to proceed ______ the summit.",
        optionsTemplate: ["towards", "against", "across", "beneath"],
      },
      variableSchema: { variables: [] },
      constraints: {},
      solutionSchema: {
        correctAnswer: "towards",
        steps: ["'Towards' correctly indicates the direction of movement."],
        finalAnswer: "towards",
      },
    },
    {
      name: "TCS_NQT_VERBAL_ABILITY_HARD",
      templateKey: "VERBAL_ABILITY_HARD_001",
      conceptKey: "VERBAL_ABILITY",
      difficultyLevel: DifficultyLevel.HARD,
      questionType: "multiple_choice",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Para-jumble sentence ordering",
      isActive: true,
      structure: {
        questionTemplate:
          "Arrange the sentences P, Q, R, S to form a coherent paragraph:\nP: It fosters critical thinking and empathy.\nQ: Reading is a habit that transforms minds.\nR: Furthermore, it exposes individuals to diverse cultures.\nS: Through books, readers explore worlds beyond their immediate reality.",
        optionsTemplate: ["Q-S-P-R", "P-Q-R-S", "S-Q-P-R", "Q-P-R-S"],
      },
      variableSchema: { variables: [] },
      constraints: {},
      solutionSchema: {
        correctAnswer: "Q-S-P-R",
        steps: [
          "Q introduces the topic (Reading).",
          "S elaborates on the mechanism (Through books).",
          "P states the first benefit.",
          "R adds a further benefit starting with 'Furthermore'.",
        ],
        finalAnswer: "Q-S-P-R",
      },
    },
    {
      name: "TCS_NQT_REASONING_ABILITY_EASY",
      templateKey: "REASONING_ABILITY_EASY_001",
      conceptKey: "REASONING_ABILITY",
      difficultyLevel: DifficultyLevel.EASY,
      questionType: "multiple_choice",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Arithmetic sequence problem",
      isActive: true,
      structure: {
        questionTemplate:
          "Find the missing number in the sequence: {{n1}}, {{n2}}, {{n3}}, {{n4}}, ?",
        optionsTemplate: [
          "{{correct_answer}}",
          "{{distractor_1}}",
          "{{distractor_2}}",
          "{{distractor_3}}",
        ],
      },
      variableSchema: {
        variables: [
          { name: "start", type: "number", min: 3, max: 15, step: 2 },
          { name: "diff", type: "number", min: 4, max: 8, step: 2 },
        ],
        derived: [
          { name: "n1", formula: "start" },
          { name: "n2", formula: "start + diff" },
          { name: "n3", formula: "start + diff * 2" },
          { name: "n4", formula: "start + diff * 3" },
          { name: "correct_answer", formula: "start + diff * 4" },
          { name: "distractor_1", formula: "start + diff * 4 + 2" },
          { name: "distractor_2", formula: "start + diff * 4 - 2" },
          { name: "distractor_3", formula: "start + diff * 4 + diff" },
        ],
      },
      constraints: { excludeDuplicates: true },
      solutionSchema: {
        correctVariable: "correct_answer",
        steps: ["Each consecutive term increases by a constant difference diff."],
        finalAnswer: "correct_answer",
      },
    },
    {
      name: "TCS_NQT_REASONING_ABILITY_MEDIUM",
      templateKey: "REASONING_ABILITY_MED_001",
      conceptKey: "REASONING_ABILITY",
      difficultyLevel: DifficultyLevel.MEDIUM,
      questionType: "multiple_choice",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Blood relations deduction",
      isActive: true,
      structure: {
        questionTemplate:
          "Pointing to a photograph of a woman, a man says: 'She is the mother of my father\\'s only daughter-in-law.' How is the woman related to the man\\'s wife?",
        optionsTemplate: ["Mother", "Sister", "Mother-in-law", "Aunt"],
      },
      variableSchema: { variables: [] },
      constraints: {},
      solutionSchema: {
        correctAnswer: "Mother",
        steps: [
          "Father's only daughter-in-law = Man's wife.",
          "Mother of man's wife = Mother to the wife.",
        ],
        finalAnswer: "Mother",
      },
    },
    {
      name: "TCS_NQT_REASONING_ABILITY_HARD",
      templateKey: "REASONING_ABILITY_HARD_001",
      conceptKey: "REASONING_ABILITY",
      difficultyLevel: DifficultyLevel.HARD,
      questionType: "multiple_choice",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Circular seating arrangement deduction",
      isActive: true,
      structure: {
        questionTemplate:
          "Six persons A, B, C, D, E, and F sit around a circular table facing the center. B is between A and C. E is opposite B. D is immediately to the right of E. Who is sitting immediately to the left of C?",
        optionsTemplate: ["B", "E", "D", "A"],
      },
      variableSchema: { variables: [] },
      constraints: {},
      solutionSchema: {
        correctAnswer: "B",
        steps: [
          "Place E and B opposite.",
          "D is right of E.",
          "B is between A and C, placing B to the immediate left of C when facing center.",
        ],
        finalAnswer: "B",
      },
    },
    {
      name: "TCS_NQT_CODING_EASY",
      templateKey: "CODING_EASY_001",
      conceptKey: "CODING",
      difficultyLevel: DifficultyLevel.EASY,
      questionType: "coding",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Array palindrome check",
      isActive: true,
      structure: {
        prompt:
          "Write a function `isPalindrome(arr)` that returns `true` if an array reads the same backwards and forwards, or `false` otherwise.",
      },
      variableSchema: { variables: [] },
      constraints: { timeLimitMs: 1000, memoryLimitMb: 128 },
      solutionSchema: {
        oracleKey: "PALINDROME_ORACLE",
        steps: ["Compare elements from both ends moving towards center."],
      },
    },
    {
      name: "TCS_NQT_CODING_MEDIUM",
      templateKey: "CODING_MED_001",
      conceptKey: "CODING",
      difficultyLevel: DifficultyLevel.MEDIUM,
      questionType: "coding",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Array cyclic rotation by K positions",
      isActive: true,
      structure: {
        prompt:
          "Write a function `rotateArray(arr, k)` that rotates an integer array to the right by `k` steps.",
      },
      variableSchema: { variables: [] },
      constraints: { timeLimitMs: 1500, memoryLimitMb: 128 },
      solutionSchema: {
        oracleKey: "ARRAY_ROTATION_ORACLE",
        steps: ["Normalize k = k % arr.length", "Reverse whole array, reverse first k, reverse remaining."],
      },
    },
    {
      name: "TCS_NQT_CODING_HARD",
      templateKey: "CODING_HARD_001",
      conceptKey: "CODING",
      difficultyLevel: DifficultyLevel.HARD,
      questionType: "coding",
      generationStrategy: GenerationStrategy.VARIABLE,
      description: "Longest common substring between two strings",
      isActive: true,
      structure: {
        prompt:
          "Write a function `longestCommonSubstring(s1, s2)` that finds the longest continuous substring shared by two strings.",
      },
      variableSchema: { variables: [] },
      constraints: { timeLimitMs: 2000, memoryLimitMb: 256 },
      solutionSchema: {
        steps: ["Use dynamic programming matrix to track matching substring lengths."],
      },
    },
  ];

  for (const template of templates) {
    await prisma.template.create({
      data: template as any,
    });
  }

  console.log("Templates seeded successfully.");
}
