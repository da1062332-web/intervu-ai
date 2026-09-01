import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=========================================");
  console.log("AUDITING PUBLISHED COGNIZANT QUANTS ASSESSMENT");
  console.log("=========================================\n");

  // 1. Find test config / assembly by title
  const testConfigs = await prisma.testConfig.findMany({
    where: {
      title: { contains: "Cognizant", mode: "insensitive" }
    },
    include: {
      sections: true
    }
  });

  console.log(`Found ${testConfigs.length} TestConfig(s) matching 'Cognizant':`);
  for (const tc of testConfigs) {
    console.log(`- TestConfig ID: ${tc.id} | Title: "${tc.title}" | Code: ${tc.code} | Status: ${tc.status}`);
  }

  // Find published assemblies
  const assemblies = await prisma.testAssembly.findMany({
    where: {
      OR: [
        { title: { contains: "Cognizant", mode: "insensitive" } },
        { title: { contains: "Quantitative", mode: "insensitive" } }
      ]
    },
    include: {
      sections: {
        include: {
          items: {
            include: {
              question: true
            }
          }
        }
      }
    }
  });

  console.log(`\nFound ${assemblies.length} TestAssembly(ies):`);
  for (const asm of assemblies) {
    console.log(`\n==================================================`);
    console.log(`ASSEMBLY: "${asm.title}" [ID: ${asm.id}]`);
    console.log(`Status: ${asm.status} | Total Questions: ${asm.totalQuestions}`);
    console.log(`==================================================`);

    let issueCount = 0;
    let totalQuestionsChecked = 0;

    for (const section of asm.sections) {
      console.log(`\n--- Section: "${section.name}" (Items: ${section.items.length}) ---`);
      for (const item of section.items) {
        totalQuestionsChecked++;
        const q = item.question;
        console.log(`\n[Q#${item.sequenceOrder}] ID: ${q.id} | Code: ${q.code} | Difficulty: ${q.difficulty}`);
        console.log(`  Question Text: "${q.questionText}"`);
        
        const options: any = q.options || [];
        console.log(`  Options:`, JSON.stringify(options));
        console.log(`  Correct Answer:`, JSON.stringify(q.correctAnswer));
        console.log(`  Explanation:`, q.explanation ? `"${q.explanation.substring(0, 100)}..."` : "NONE");

        // VALIDATION CHECKS
        const errors: string[] = [];

        // Check 1: Options non-empty and has at least 4 choices
        if (!Array.isArray(options) || options.length < 4) {
          errors.push(`Options count is less than 4 (found ${Array.isArray(options) ? options.length : 0})`);
        }

        // Check 2: Correct answer exists in options
        const matchFound = options.some((opt: any) => {
          const val = typeof opt === "object" ? opt.text || opt.value || opt.id : String(opt);
          const isCorr = typeof opt === "object" ? opt.isCorrect : false;
          return isCorr || String(val).trim() === String(q.correctAnswer).trim() || String(opt.id) === String(q.correctAnswer);
        });

        if (!matchFound) {
          errors.push(`Correct answer "${q.correctAnswer}" was NOT found in the options list!`);
        }

        // Check 3: Check for duplicate options
        const optionValues = options.map((opt: any) => typeof opt === "object" ? String(opt.text || opt.value).trim() : String(opt).trim());
        const uniqueValues = new Set(optionValues);
        if (uniqueValues.size < optionValues.length) {
          errors.push(`Duplicate options detected: ${JSON.stringify(optionValues)}`);
        }

        // Check 4: Question text unresolved placeholders
        if (q.questionText.includes("{{") || q.questionText.includes("}}")) {
          errors.push(`Unresolved placeholder(s) in question text: "${q.questionText}"`);
        }

        if (errors.length > 0) {
          issueCount++;
          console.error(`  ❌ ISSUES DETECTED:`);
          for (const err of errors) {
            console.error(`     - ${err}`);
          }
        } else {
          console.log(`  ✅ VALID`);
        }
      }
    }

    console.log(`\n================ SUMMARY FOR "${asm.title}" ================`);
    console.log(`- Total Questions Inspected: ${totalQuestionsChecked}`);
    console.log(`- Questions with Issues:    ${issueCount}`);
    console.log(`==========================================================`);
  }
}

main().finally(() => prisma.$disconnect());
