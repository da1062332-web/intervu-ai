import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding MVP Database Architecture...");

  // 1. Create TCS NQT Config
  const tcsConfig = await prisma.testConfig.upsert({
    where: { configKey: "TCS_NQT_APTITUDE" },
    update: {},
    create: {
      configKey: "TCS_NQT_APTITUDE",
      companyName: "TCS",
      displayName: "TCS NQT Aptitude Config",
      totalDurationSeconds: 90 * 60, // 90 mins
      totalQuestions: 40,
      sections: {
        create: [
          {
            sectionKey: "APTITUDE",
            displayName: "Aptitude",
            durationSeconds: 45 * 60,
            questionCount: 20,
            orderIndex: 0,
          },
          {
            sectionKey: "REASONING",
            displayName: "Reasoning",
            durationSeconds: 45 * 60,
            questionCount: 20,
            orderIndex: 1,
          },
        ],
      },
      rule: {
        create: {
          negativeMarking: false,
          sectionLocking: true,
          shuffleQuestions: true,
          allowNavigation: true,
        },
      },
    },
  });
  console.log(`Created Config: ${tcsConfig.configKey}`);

  // 2. Create 15 Real Mathematical templates (5 concepts × 3 difficulties)
  const templatesData = [
    // ─── Time & Work ─────────────────────────────────────────────────────────
    {
      templateKey: "TPL_TIME_WORK_EASY",
      conceptKey: "time_work",
      difficultyLevel: "EASY",
      questionType: "MULTIPLE_CHOICE",
      name: "Time and Work - Easy",
      structure: {
        questionTemplate:
          "{worker_A} can complete a project in {days_A} days, and {worker_B} can complete the same project in {days_B} days. Working together, in how many days will they finish the project?",
        metadata: {
          w1_steps: 2.0,
          w2_number_complexity: 1.5,
          w3_concept_overlap: 1.0,
          w4_trick_factor: 1.0,
        },
      },
      variableSchema: {
        variables: [
          {
            name: "worker_A",
            type: "string",
            options: ["Alice", "Amit", "Rahul", "Anil"],
          },
          {
            name: "worker_B",
            type: "string",
            options: ["Bob", "Bipin", "Vijay", "Suresh"],
          },
          {
            name: "days_A",
            type: "number",
            range: { min: 10, max: 30, step: 2 },
          },
          {
            name: "days_B",
            type: "number",
            range: { min: 10, max: 30, step: 2 },
          },
        ],
      },
      constraints: {
        constraints: [{ rule: "days_A != days_B", severity: "critical" }],
      },
      solutionSchema: {
        steps: [
          "{worker_A}'s 1-day work = 1 / {days_A}.",
          "{worker_B}'s 1-day work = 1 / {days_B}.",
          "Combined 1-day work = 1/{days_A} + 1/{days_B} = ({days_A} + {days_B}) / ({days_A} * {days_B}).",
          "Total days required = ({days_A} * {days_B}) / ({days_A} + {days_B}).",
        ],
        finalAnswer: "(days_A * days_B) / (days_A + days_B)",
      },
    },
    {
      templateKey: "TPL_TIME_WORK_MEDIUM",
      conceptKey: "time_work",
      difficultyLevel: "MEDIUM",
      questionType: "MULTIPLE_CHOICE",
      name: "Time and Work - Medium",
      structure: {
        questionTemplate:
          "If {workers} workers complete a task in {days} days, how many days will it take for {new_workers} workers to complete the same task?",
        metadata: {
          w1_steps: 3.0,
          w2_number_complexity: 2.0,
          w3_concept_overlap: 1.5,
          w4_trick_factor: 1.5,
        },
      },
      variableSchema: {
        variables: [
          {
            name: "workers",
            type: "number",
            range: { min: 3, max: 10, step: 1 },
          },
          { name: "days", type: "number", range: { min: 5, max: 20, step: 1 } },
          {
            name: "new_workers",
            type: "number",
            range: { min: 2, max: 12, step: 1 },
          },
        ],
      },
      constraints: {
        constraints: [{ rule: "workers != new_workers", severity: "critical" }],
      },
      solutionSchema: {
        steps: [
          "Total work = workers * days = {workers} * {days}.",
          "Days for new workers = (workers * days) / new_workers = ({workers} * {days}) / {new_workers}.",
        ],
        finalAnswer: "(workers * days) / new_workers",
      },
    },
    {
      templateKey: "TPL_TIME_WORK_HARD",
      conceptKey: "time_work",
      difficultyLevel: "HARD",
      questionType: "MULTIPLE_CHOICE",
      name: "Time and Work - Hard",
      structure: {
        questionTemplate:
          "{worker_A} can do a piece of work in {days_A} days. {worker_B} is {percent_more}% more efficient than {worker_A}. In how many days will {worker_B} alone finish the work?",
        metadata: {
          w1_steps: 4.0,
          w2_number_complexity: 3.0,
          w3_concept_overlap: 2.0,
          w4_trick_factor: 2.5,
        },
      },
      variableSchema: {
        variables: [
          {
            name: "worker_A",
            type: "string",
            options: ["Alice", "Amit", "Rahul", "Anil"],
          },
          {
            name: "worker_B",
            type: "string",
            options: ["Bob", "Bipin", "Vijay", "Suresh"],
          },
          {
            name: "days_A",
            type: "number",
            range: { min: 15, max: 30, step: 5 },
          },
          {
            name: "percent_more",
            type: "number",
            range: { min: 25, max: 100, step: 25 },
          },
        ],
      },
      constraints: { constraints: [] },
      solutionSchema: {
        steps: [
          "Ratio of efficiency of {worker_A} to {worker_B} is 100 : (100 + {percent_more}).",
          "Time taken by {worker_B} = days_A * (100 / (100 + percent_more)) = {days_A} / (1 + {percent_more}/100).",
        ],
        finalAnswer: "days_A / (1 + percent_more / 100)",
      },
    },
    // ─── Probability ────────────────────────────────────────────────────────
    {
      templateKey: "TPL_PROBABILITY_EASY",
      conceptKey: "probability",
      difficultyLevel: "EASY",
      questionType: "MULTIPLE_CHOICE",
      name: "Probability - Easy",
      structure: {
        questionTemplate:
          "A bag contains {blue_balls} blue balls and {red_balls} red balls. If one ball is drawn at random, what is the probability (in %) of drawing a blue ball?",
        metadata: {
          w1_steps: 2.0,
          w2_number_complexity: 1.5,
          w3_concept_overlap: 1.0,
          w4_trick_factor: 1.0,
        },
      },
      variableSchema: {
        variables: [
          {
            name: "blue_balls",
            type: "number",
            range: { min: 2, max: 8, step: 1 },
          },
          {
            name: "red_balls",
            type: "number",
            range: { min: 2, max: 8, step: 1 },
          },
        ],
      },
      constraints: {
        constraints: [
          { rule: "blue_balls != red_balls", severity: "critical" },
        ],
      },
      solutionSchema: {
        steps: [
          "Total number of balls = blue_balls + red_balls = {blue_balls} + {red_balls}.",
          "Probability = (blue_balls / total) * 100 = ({blue_balls} / ({blue_balls} + {red_balls})) * 100.",
        ],
        finalAnswer: "(blue_balls / (blue_balls + red_balls)) * 100",
      },
    },
    {
      templateKey: "TPL_PROBABILITY_MEDIUM",
      conceptKey: "probability",
      difficultyLevel: "MEDIUM",
      questionType: "MULTIPLE_CHOICE",
      name: "Probability - Medium",
      structure: {
        questionTemplate:
          "A box contains {defective} defective items and {good} good items. If two items are selected at random, what is the probability (in %) that both are good?",
        metadata: {
          w1_steps: 3.5,
          w2_number_complexity: 2.0,
          w3_concept_overlap: 1.8,
          w4_trick_factor: 2.0,
        },
      },
      variableSchema: {
        variables: [
          {
            name: "defective",
            type: "number",
            range: { min: 2, max: 5, step: 1 },
          },
          { name: "good", type: "number", range: { min: 6, max: 12, step: 1 } },
        ],
      },
      constraints: { constraints: [] },
      solutionSchema: {
        steps: [
          "Total items = defective + good = {defective} + {good}.",
          "Probability of first item being good = good / total.",
          "Probability of second item being good = (good - 1) / (total - 1).",
          "Combined probability = (good * (good - 1)) / (total * (total - 1)) * 100.",
        ],
        finalAnswer:
          "(good * (good - 1)) / ((good + defective) * (good + defective - 1)) * 100",
      },
    },
    {
      templateKey: "TPL_PROBABILITY_HARD",
      conceptKey: "probability",
      difficultyLevel: "HARD",
      questionType: "MULTIPLE_CHOICE",
      name: "Probability - Hard",
      structure: {
        questionTemplate:
          "In a class of {total} students, {math} study Mathematics, {science} study Science, and {both} study both. If a student is chosen at random, what is the probability (in %) that they study neither Mathematics nor Science?",
        metadata: {
          w1_steps: 4.0,
          w2_number_complexity: 2.5,
          w3_concept_overlap: 2.0,
          w4_trick_factor: 2.5,
        },
      },
      variableSchema: {
        variables: [
          {
            name: "total",
            type: "number",
            range: { min: 40, max: 60, step: 5 },
          },
          {
            name: "math",
            type: "number",
            range: { min: 20, max: 30, step: 1 },
          },
          {
            name: "science",
            type: "number",
            range: { min: 15, max: 25, step: 1 },
          },
          { name: "both", type: "number", range: { min: 5, max: 10, step: 1 } },
        ],
      },
      constraints: {
        constraints: [
          { rule: "math + science - both < total", severity: "critical" },
          { rule: "both < math", severity: "critical" },
          { rule: "both < science", severity: "critical" },
        ],
      },
      solutionSchema: {
        steps: [
          "Students studying math or science = math + science - both = {math} + {science} - {both}.",
          "Students studying neither = total - (math or science) = {total} - ({math} + {science} - {both}).",
          "Probability = (neither / total) * 100.",
        ],
        finalAnswer: "((total - (math + science - both)) / total) * 100",
      },
    },
    // ─── Percentages ─────────────────────────────────────────────────────────
    {
      templateKey: "TPL_PERCENTAGES_EASY",
      conceptKey: "percentages",
      difficultyLevel: "EASY",
      questionType: "MULTIPLE_CHOICE",
      name: "Percentages - Easy",
      structure: {
        questionTemplate: "What is {percent}% of {amount}?",
        metadata: {
          w1_steps: 1.5,
          w2_number_complexity: 1.2,
          w3_concept_overlap: 1.0,
          w4_trick_factor: 1.0,
        },
      },
      variableSchema: {
        variables: [
          {
            name: "percent",
            type: "number",
            range: { min: 5, max: 40, step: 5 },
          },
          {
            name: "amount",
            type: "number",
            range: { min: 100, max: 1000, step: 50 },
          },
        ],
      },
      constraints: { constraints: [] },
      solutionSchema: {
        steps: [
          "Formula: (percent * amount) / 100 = ({percent} * {amount}) / 100.",
        ],
        finalAnswer: "(percent * amount) / 100",
      },
    },
    {
      templateKey: "TPL_PERCENTAGES_MEDIUM",
      conceptKey: "percentages",
      difficultyLevel: "MEDIUM",
      questionType: "MULTIPLE_CHOICE",
      name: "Percentages - Medium",
      structure: {
        questionTemplate:
          "If the price of petrol is increased by {percent_increase}%, by how much percent must a motorist reduce the consumption of petrol so as not to increase his expenditure?",
        metadata: {
          w1_steps: 3.0,
          w2_number_complexity: 2.0,
          w3_concept_overlap: 1.5,
          w4_trick_factor: 2.0,
        },
      },
      variableSchema: {
        variables: [
          {
            name: "percent_increase",
            type: "number",
            range: { min: 10, max: 50, step: 5 },
          },
        ],
      },
      constraints: { constraints: [] },
      solutionSchema: {
        steps: [
          "Let the original price be 100 and consumption be 100.",
          "New price = 100 + {percent_increase}.",
          "Reduction in consumption = ({percent_increase} / (100 + {percent_increase})) * 100.",
        ],
        finalAnswer: "(percent_increase / (100 + percent_increase)) * 100",
      },
    },
    {
      templateKey: "TPL_PERCENTAGES_HARD",
      conceptKey: "percentages",
      difficultyLevel: "HARD",
      questionType: "MULTIPLE_CHOICE",
      name: "Percentages - Hard",
      structure: {
        questionTemplate:
          "A candidate who gets {percent_A}% marks fails by {marks_A} marks, while another candidate who gets {percent_B}% marks gets {marks_B} marks more than the passing marks. Find the maximum marks of the exam.",
        metadata: {
          w1_steps: 4.0,
          w2_number_complexity: 2.5,
          w3_concept_overlap: 2.0,
          w4_trick_factor: 2.5,
        },
      },
      variableSchema: {
        variables: [
          {
            name: "percent_A",
            type: "number",
            range: { min: 25, max: 35, step: 5 },
          },
          {
            name: "percent_B",
            type: "number",
            range: { min: 45, max: 55, step: 5 },
          },
          {
            name: "marks_A",
            type: "number",
            range: { min: 10, max: 30, step: 5 },
          },
          {
            name: "marks_B",
            type: "number",
            range: { min: 10, max: 30, step: 5 },
          },
        ],
      },
      constraints: {
        constraints: [{ rule: "percent_B > percent_A", severity: "critical" }],
      },
      solutionSchema: {
        steps: [
          "Difference in percent = percent_B - percent_A = {percent_B} - {percent_A}.",
          "Difference in marks = marks_A + marks_B = {marks_A} + {marks_B}.",
          "Maximum marks = (Difference in marks / Difference in percent) * 100.",
        ],
        finalAnswer: "((marks_A + marks_B) / (percent_B - percent_A)) * 100",
      },
    },
    // ─── Averages ────────────────────────────────────────────────────────────
    {
      templateKey: "TPL_AVERAGES_EASY",
      conceptKey: "averages",
      difficultyLevel: "EASY",
      questionType: "MULTIPLE_CHOICE",
      name: "Averages - Easy",
      structure: {
        questionTemplate:
          "Find the average of the following three numbers: {num1}, {num2}, and {num3}.",
        metadata: {
          w1_steps: 1.5,
          w2_number_complexity: 1.2,
          w3_concept_overlap: 1.0,
          w4_trick_factor: 1.0,
        },
      },
      variableSchema: {
        variables: [
          {
            name: "num1",
            type: "number",
            range: { min: 10, max: 50, step: 1 },
          },
          {
            name: "num2",
            type: "number",
            range: { min: 10, max: 50, step: 1 },
          },
          {
            name: "num3",
            type: "number",
            range: { min: 10, max: 50, step: 1 },
          },
        ],
      },
      constraints: { constraints: [] },
      solutionSchema: {
        steps: [
          "Sum = num1 + num2 + num3 = {num1} + {num2} + {num3}.",
          "Average = Sum / 3.",
        ],
        finalAnswer: "(num1 + num2 + num3) / 3",
      },
    },
    {
      templateKey: "TPL_AVERAGES_MEDIUM",
      conceptKey: "averages",
      difficultyLevel: "MEDIUM",
      questionType: "MULTIPLE_CHOICE",
      name: "Averages - Medium",
      structure: {
        questionTemplate:
          "The average weight of {count} students is {avg_weight} kg. If the teacher's weight is added, the average weight increases by {increase} kg. What is the weight of the teacher in kg?",
        metadata: {
          w1_steps: 3.0,
          w2_number_complexity: 2.0,
          w3_concept_overlap: 1.5,
          w4_trick_factor: 1.5,
        },
      },
      variableSchema: {
        variables: [
          {
            name: "count",
            type: "number",
            range: { min: 15, max: 25, step: 1 },
          },
          {
            name: "avg_weight",
            type: "number",
            range: { min: 40, max: 50, step: 1 },
          },
          {
            name: "increase",
            type: "number",
            range: { min: 1, max: 3, step: 1 },
          },
        ],
      },
      constraints: { constraints: [] },
      solutionSchema: {
        steps: [
          "Total weight of students = count * avg_weight = {count} * {avg_weight}.",
          "New count = count + 1.",
          "New average = avg_weight + increase = {avg_weight} + {increase}.",
          "Teacher weight = (new count * new average) - total weight.",
        ],
        finalAnswer: "avg_weight + (count + 1) * increase",
      },
    },
    {
      templateKey: "TPL_AVERAGES_HARD",
      conceptKey: "averages",
      difficultyLevel: "HARD",
      questionType: "MULTIPLE_CHOICE",
      name: "Averages - Hard",
      structure: {
        questionTemplate:
          "The average temperature for Monday, Tuesday and Wednesday was {avg1} degrees. The average for Tuesday, Wednesday and Thursday was {avg2} degrees. If the temperature on Thursday was {temp_thursday} degrees, what was the temperature on Monday?",
        metadata: {
          w1_steps: 4.0,
          w2_number_complexity: 2.5,
          w3_concept_overlap: 2.0,
          w4_trick_factor: 2.5,
        },
      },
      variableSchema: {
        variables: [
          {
            name: "avg1",
            type: "number",
            range: { min: 35, max: 40, step: 1 },
          },
          {
            name: "avg2",
            type: "number",
            range: { min: 36, max: 41, step: 1 },
          },
          {
            name: "temp_thursday",
            type: "number",
            range: { min: 32, max: 42, step: 1 },
          },
        ],
      },
      constraints: {
        constraints: [{ rule: "avg2 != avg1", severity: "critical" }],
      },
      solutionSchema: {
        steps: [
          "Sum(Mon+Tue+Wed) = 3 * avg1 = 3 * {avg1}.",
          "Sum(Tue+Wed+Thu) = 3 * avg2 = 3 * {avg2}.",
          "Difference: Mon - Thu = 3 * (avg1 - avg2).",
          "Mon = Thu + 3 * (avg1 - avg2) = {temp_thursday} + 3 * ({avg1} - {avg2}).",
        ],
        finalAnswer: "temp_thursday + 3 * (avg1 - avg2)",
      },
    },
    // ─── Profit & Loss ───────────────────────────────────────────────────────
    {
      templateKey: "TPL_PROFIT_LOSS_EASY",
      conceptKey: "profit_loss",
      difficultyLevel: "EASY",
      questionType: "MULTIPLE_CHOICE",
      name: "Profit and Loss - Easy",
      structure: {
        questionTemplate:
          "A shopkeeper sells an item for Rs. {selling_price} that cost Rs. {cost_price} to purchase. What is the net profit (in Rs.)?",
        metadata: {
          w1_steps: 1.5,
          w2_number_complexity: 1.2,
          w3_concept_overlap: 1.0,
          w4_trick_factor: 1.0,
        },
      },
      variableSchema: {
        variables: [
          {
            name: "cost_price",
            type: "number",
            range: { min: 100, max: 500, step: 10 },
          },
          {
            name: "selling_price",
            type: "number",
            range: { min: 510, max: 800, step: 10 },
          },
        ],
      },
      constraints: {
        constraints: [
          { rule: "selling_price > cost_price", severity: "critical" },
        ],
      },
      solutionSchema: {
        steps: [
          "Profit = selling_price - cost_price = {selling_price} - {cost_price}.",
        ],
        finalAnswer: "selling_price - cost_price",
      },
    },
    {
      templateKey: "TPL_PROFIT_LOSS_MEDIUM",
      conceptKey: "profit_loss",
      difficultyLevel: "MEDIUM",
      questionType: "MULTIPLE_CHOICE",
      name: "Profit and Loss - Medium",
      structure: {
        questionTemplate:
          "A retailer purchases a product for Rs. {cost_price} and sells it at Rs. {selling_price}. Calculate the net profit or loss percentage for this transaction.",
        metadata: {
          w1_steps: 3.0,
          w2_number_complexity: 2.0,
          w3_concept_overlap: 2.0,
          w4_trick_factor: 1.5,
        },
      },
      variableSchema: {
        variables: [
          {
            name: "cost_price",
            type: "number",
            range: { min: 100, max: 1000, step: 10 },
          },
          {
            name: "selling_price",
            type: "number",
            range: { min: 120, max: 1500, step: 10 },
          },
        ],
      },
      constraints: {
        constraints: [
          { rule: "selling_price != cost_price", severity: "critical" },
        ],
      },
      solutionSchema: {
        steps: [
          "Net profit/loss = selling_price - cost_price.",
          "Percentage = (Net profit/loss / cost_price) * 100.",
        ],
        finalAnswer: "((selling_price - cost_price) / cost_price) * 100",
      },
    },
    {
      templateKey: "TPL_PROFIT_LOSS_HARD",
      conceptKey: "profit_loss",
      difficultyLevel: "HARD",
      questionType: "MULTIPLE_CHOICE",
      name: "Profit and Loss - Hard",
      structure: {
        questionTemplate:
          "A dealer sells a machine for Rs. {price} at a loss of {loss_percent}%. What should be the selling price (in Rs.) to gain {gain_percent}%?",
        metadata: {
          w1_steps: 4.0,
          w2_number_complexity: 2.5,
          w3_concept_overlap: 2.0,
          w4_trick_factor: 2.5,
        },
      },
      variableSchema: {
        variables: [
          {
            name: "price",
            type: "number",
            range: { min: 720, max: 1800, step: 90 },
          },
          {
            name: "loss_percent",
            type: "number",
            range: { min: 10, max: 20, step: 5 },
          },
          {
            name: "gain_percent",
            type: "number",
            range: { min: 5, max: 15, step: 5 },
          },
        ],
      },
      constraints: {
        constraints: [{ rule: "100 - loss_percent > 0", severity: "critical" }],
      },
      solutionSchema: {
        steps: [
          "Cost Price = price / (1 - loss_percent / 100) = ({price} / (100 - {loss_percent})) * 100.",
          "New Selling Price = Cost Price * (1 + gain_percent / 100) = (price / (100 - loss_percent)) * (100 + gain_percent).",
        ],
        finalAnswer: "(price / (100 - loss_percent)) * (100 + gain_percent)",
      },
    },
  ];

  for (const t of templatesData) {
    await prisma.template.upsert({
      where: { templateKey: t.templateKey },
      update: {},
      create: {
        templateKey: t.templateKey,
        conceptKey: t.conceptKey,
        difficultyLevel: t.difficultyLevel as any,
        questionType: t.questionType,
        name: t.name,
        structure: t.structure,
        variableSchema: t.variableSchema,
        constraints: t.constraints,
        solutionSchema: t.solutionSchema,
      },
    });
    console.log(`Seeded Template: ${t.templateKey}`);
  }

  await seedEvaluations(prisma);

  console.log("Seeding completed successfully.");
}

async function seedEvaluations(prisma: PrismaClient) {
  console.log("Seeding mock evaluations, skill scores, recommendations, and performance summaries...");

  // 1. Create mock users
  const usersData = Array.from({ length: 5 }).map((_, i) => ({
    email: `candidate_eval_${i + 1}@example.com`,
    fullName: `Candidate Evaluated ${i + 1}`,
    passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$lSjZq1w1zU8wX2$H5/U4hT4lV7vD9j9K8Fq4g", // mock hash
  }));

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
    users.push(user);
  }

  // Get first test config
  const config = await prisma.testConfig.findFirst();
  if (!config) return;

  const skillsList = ["Aptitude", "Reasoning", "TypeScript", "SQL", "Problem Solving"];
  const recommendationsList = [
    { title: "Review time complexity", desc: "Study Big-O notation and recursion." },
    { title: "Practice SQL joins", desc: "Review inner, left, and outer joins with query plans." },
    { title: "Improve verbal logic", desc: "Practice syllogisms and sentence correction." },
    { title: "Refactor nested loops", desc: "Avoid quadratic time complexity in array searches." },
  ];

  // 2. Create 20 test instances and evaluations (4 per user)
  for (const user of users) {
    let completedCount = 0;
    let totalScore = 0;
    let bestScore = 0;

    for (let i = 0; i < 4; i++) {
      const instance = await prisma.testInstance.create({
        data: {
          userId: user.id,
          testConfigId: config.id,
          status: "COMPLETED",
          startedAt: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000),
          submittedAt: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
        },
      });

      const score = Math.floor(60 + Math.random() * 35); // 60 - 95
      totalScore += score;
      completedCount++;
      bestScore = Math.max(bestScore, score);

      await prisma.evaluationResult.create({
        data: {
          testInstanceId: instance.id,
          userId: user.id,
          overallScore: score,
          confidenceScore: parseFloat((0.7 + Math.random() * 0.25).toFixed(2)),
          communicationScore: Math.floor(65 + Math.random() * 30),
          technicalScore: Math.floor(65 + Math.random() * 30),
          overallRating: parseFloat((3.0 + Math.random() * 2.0).toFixed(1)),
          notes: `Mock evaluation for test run ${i + 1}.`,
          totalQuestions: 40,
          correctAnswers: Math.floor(score * 0.4),
          incorrectAnswers: 40 - Math.floor(score * 0.4),
          evaluatedAt: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
          skillScores: {
            create: Array.from({ length: 3 }).map((_, j) => ({
              skill: skillsList[(i + j) % skillsList.length],
              score: Math.floor(score - 5 + Math.random() * 10),
              feedback: `Demonstrates good understanding of ${skillsList[(i + j) % skillsList.length]}.`,
            })),
          },
          recommendations: {
            create: Array.from({ length: 2 }).map((_, j) => {
              const rec = recommendationsList[(i + j) % recommendationsList.length];
              return {
                skill: skillsList[(i + j) % skillsList.length],
                priority: j === 0 ? "HIGH" : "MEDIUM",
                title: rec.title,
                description: rec.desc,
              };
            }),
          },
        },
      });
    }

    // 3. Create PerformanceSummary for the user
    await prisma.performanceSummary.upsert({
      where: { userId: user.id },
      update: {
        testsCompleted: completedCount,
        averageScore: parseFloat((totalScore / completedCount).toFixed(2)),
        bestScore,
        lastAssessmentDate: new Date(),
      },
      create: {
        userId: user.id,
        testsCompleted: completedCount,
        averageScore: parseFloat((totalScore / completedCount).toFixed(2)),
        bestScore,
        lastAssessmentDate: new Date(),
      },
    });
  }
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
