import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: url,
    },
  },
});

const TOPIC_ID = "ba203ab6-233f-4474-a5d8-1d93bce318ca"; // Reasoning Ability

// Concepts
const CONCEPTS = {
  LETTER_SERIES: "e6b79085-466e-45f9-815b-22228cbc04eb",
  LETTER_ANALOGY: "3bb68ea6-15ca-45b3-bd48-d88282632f9b",
  NUMBER_SERIES: "cdf09a1d-4a9c-4cf3-a00c-f89a9f5e8c4b",
  BLOOD_RELATION: "392b1537-dab0-42f2-a9d4-22b3d1b6f0d4",
  STATEMENT_AND_COURSE_OF_ACTION: "7b9993f9-9352-4d8e-9db4-5cdbc96df99d",
  AGE: "1ac191fd-e84f-4938-b6f7-8418f4c7f155",
  STATEMENTS_AND_CONCLUSION: "bc6f9012-9287-4044-8944-cdd7ba68d55e",
};

interface QuestionSeed {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  conceptId: string;
  questionTitle: string;
}

const questionsToSeed: QuestionSeed[] = [
  // --- EASY QUESTIONS ---
  {
    questionTitle: "Letter Series - Basic Alphabetical Sequence",
    questionText: "Find the next term in the series: A, C, E, G, I, ?",
    options: ["J", "K", "L", "M"],
    correctAnswer: "K",
    explanation: "Each letter in the series skips one letter in the English alphabet (A (+2) -> C (+2) -> E (+2) -> G (+2) -> I (+2) -> K). Therefore, the next letter is K.",
    difficulty: "EASY",
    conceptId: CONCEPTS.LETTER_SERIES,
  },
  {
    questionTitle: "Number Series - Arithmetic Progression",
    questionText: "What is the next number in the sequence: 4, 8, 12, 16, 20, ?",
    options: ["22", "24", "26", "28"],
    correctAnswer: "24",
    explanation: "The sequence increases by adding 4 each time (arithmetic progression with common difference of 4). 20 + 4 = 24.",
    difficulty: "EASY",
    conceptId: CONCEPTS.NUMBER_SERIES,
  },
  {
    questionTitle: "Letter Analogy - Opposite Pair",
    questionText: "AZ is related to BY in the same way as CX is related to:",
    options: ["DW", "EV", "FU", "GT"],
    correctAnswer: "DW",
    explanation: "A (1st from start) pairs with Z (1st from end). B (2nd) pairs with Y (2nd). C (3rd) pairs with X (3rd). Following this pattern, D (4th from start) pairs with W (4th from end). Thus, the answer is DW.",
    difficulty: "EASY",
    conceptId: CONCEPTS.LETTER_ANALOGY,
  },
  {
    questionTitle: "Blood Relation - Direct Family Connection",
    questionText: "Pointing to a photograph, Priya said, 'He is the only son of my grandfather's only son.' How is the boy in the photograph related to Priya?",
    options: ["Brother", "Cousin", "Father", "Uncle"],
    correctAnswer: "Brother",
    explanation: "Priya's grandfather's only son is Priya's father. The only son of Priya's father is Priya's brother. Therefore, the boy is Priya's brother.",
    difficulty: "EASY",
    conceptId: CONCEPTS.BLOOD_RELATION,
  },
  {
    questionTitle: "Age Logic - Simple Ratio & Current Age",
    questionText: "The sum of the present ages of a father and his son is 50 years. Five years ago, the father was 7 times as old as his son. What is the son's present age?",
    options: ["8 years", "10 years", "12 years", "15 years"],
    correctAnswer: "10 years",
    explanation: "Let the son's present age be S and father's age be F. F + S = 50. Five years ago: (F - 5) = 7 * (S - 5). Substituting F = 50 - S: 45 - S = 7S - 35 => 8S = 80 => S = 10 years.",
    difficulty: "EASY",
    conceptId: CONCEPTS.AGE,
  },
  {
    questionTitle: "Number Series - Square Sequence",
    questionText: "Identify the missing number in the series: 1, 4, 9, 16, 25, ?",
    options: ["30", "36", "49", "64"],
    correctAnswer: "36",
    explanation: "The series represents consecutive perfect squares: 1^2 = 1, 2^2 = 4, 3^2 = 9, 4^2 = 16, 5^2 = 25, 6^2 = 36. Hence, the missing number is 36.",
    difficulty: "EASY",
    conceptId: CONCEPTS.NUMBER_SERIES,
  },

  // --- MEDIUM QUESTIONS ---
  {
    questionTitle: "Number Series - Alternating Operation Pattern",
    questionText: "What comes next in the sequence: 3, 6, 11, 18, 27, ?",
    options: ["36", "38", "39", "40"],
    correctAnswer: "38",
    explanation: "Examine the differences between consecutive terms: 6 - 3 = 3, 11 - 6 = 5, 18 - 11 = 7, 27 - 18 = 9. The differences are consecutive odd numbers (+3, +5, +7, +9). The next difference is +11: 27 + 11 = 38.",
    difficulty: "MEDIUM",
    conceptId: CONCEPTS.NUMBER_SERIES,
  },
  {
    questionTitle: "Letter Series - Triplet Progression",
    questionText: "Find the next term in the series: BCD, EFG, HIJ, ?",
    options: ["KLM", "LMN", "KMN", "OPQ"],
    correctAnswer: "KLM",
    explanation: "Each term consists of 3 consecutive letters. The next term continues immediately from where the previous left off: BCD -> EFG -> HIJ -> KLM.",
    difficulty: "MEDIUM",
    conceptId: CONCEPTS.LETTER_SERIES,
  },
  {
    questionTitle: "Statements and Conclusion - Syllogism",
    questionText: "Statements:\n1. All cars are vehicles.\n2. Some vehicles are electric.\n\nConclusions:\nI. Some cars are electric.\nII. All electric items are vehicles.\n\nWhich of the conclusions logically follow?",
    options: [
      "Only conclusion I follows",
      "Only conclusion II follows",
      "Neither conclusion I nor II follows",
      "Both conclusions I and II follow"
    ],
    correctAnswer: "Neither conclusion I nor II follows",
    explanation: "Since 'Some vehicles are electric', the intersection between vehicles and electric does not necessarily overlap with cars (Conclusion I does not necessarily follow). Also, not all electric items are vehicles (Conclusion II does not follow). Hence, neither conclusion follows.",
    difficulty: "MEDIUM",
    conceptId: CONCEPTS.STATEMENTS_AND_CONCLUSION,
  },
  {
    questionTitle: "Blood Relation - Coded Relationship",
    questionText: "If A + B means A is the brother of B; A - B means A is the sister of B; and A * B means A is the father of B, which of the following means that C is the nephew of M?",
    options: [
      "M - N + C * D",
      "M + N * C - D",
      "N * C + M - D",
      "M - N * C + D"
    ],
    correctAnswer: "M + N * C - D",
    explanation: "In 'M + N * C - D': M is the brother of N; N is the father of C (and D). Since N is the father of C and M is N's brother, C is the son/nephew of M.",
    difficulty: "MEDIUM",
    conceptId: CONCEPTS.BLOOD_RELATION,
  },

  // --- HARD QUESTIONS ---
  {
    questionTitle: "Number Series - Complex Prime/Fibonacci Hybrid",
    questionText: "Determine the missing term in the sequence: 2, 3, 7, 16, 65, ?",
    options: ["146", "321", "244", "196"],
    correctAnswer: "321",
    explanation: "The pattern is: 2 * 1 + 1 = 3; 3 * 2 + 1 = 7; 7 * 2 + 2 = 16; 16 * 4 + 1 = 65; 65 * 5 - 4 = 321. Alternatively: n_k = (n_{k-1} * k) + (-1)^k gives 321.",
    difficulty: "HARD",
    conceptId: CONCEPTS.NUMBER_SERIES,
  },
  {
    questionTitle: "Statement and Course of Action - Policy & Disaster Response",
    questionText: "Statement:\nDue to unprecedented heavy rainfall in the city, several low-lying residential areas have been submerged in water, cutting off electricity and basic supplies.\n\nCourses of Action:\nI. The municipal corporation should immediately deploy disaster rescue teams with inflatable boats to evacuate stranded residents.\nII. Relief camps equipped with clean drinking water, food packets, and emergency medical aid should be established in nearby elevated zones immediately.\nIII. All city residents should be advised to permanently relocate their residences to other states.\n\nWhich course(s) of action should be taken?",
    options: [
      "Only I and II follow",
      "Only I and III follow",
      "Only II and III follow",
      "All I, II and III follow"
    ],
    correctAnswer: "Only I and II follow",
    explanation: "Courses of Action I and II are immediate, practical, and constructive measures to handle the flood crisis and protect lives. Action III is extreme, impractical, and disproportionate to a temporary weather event. Hence, only I and II follow.",
    difficulty: "HARD",
    conceptId: CONCEPTS.STATEMENT_AND_COURSE_OF_ACTION,
  }
];

async function main() {
  console.log(`🚀 Seeding ${questionsToSeed.length} questions for Topic 'Reasoning Ability' (${TOPIC_ID})...\n`);

  let createdCount = 0;
  for (const q of questionsToSeed) {
    const question = await prisma.question.create({
      data: {
        questionText: q.questionText,
        answer: q.correctAnswer,
        explanation: q.explanation,
        topicId: TOPIC_ID,
        conceptId: q.conceptId,
        difficulty: q.difficulty,
        difficultyScore: q.difficulty === "EASY" ? 1 : q.difficulty === "MEDIUM" ? 2 : 3,
        source: "MANUAL",
        questionSource: "MANUAL",
        questionType: "MCQ",
        questionTitle: q.questionTitle,
        questionStatement: q.questionText,
        status: "ACTIVE",
        mcqData: {
          options: q.options,
          correctAnswer: q.correctAnswer,
        },
        metadata: {
          options: q.options,
          seededAt: new Date().toISOString(),
          module: "Reasoning Ability",
        },
      },
    });
    console.log(`✅ [${q.difficulty}] Seeded: "${q.questionTitle}" (ID: ${question.id})`);
    createdCount++;
  }

  console.log(`\n🎉 Successfully inserted ${createdCount} active questions for Topic 'Reasoning Ability'!`);

  // Verify breakdown
  const breakdown = await prisma.question.groupBy({
    by: ["difficulty", "status"],
    where: { topicId: TOPIC_ID },
    _count: { id: true },
  });
  console.log("\n📊 New Question Pool Breakdown for 'Reasoning Ability':", breakdown);
}

main()
  .catch((err) => {
    console.error("Error seeding questions:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
