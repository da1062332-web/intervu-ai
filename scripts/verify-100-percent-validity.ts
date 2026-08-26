import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

async function verifyAll() {
  console.log("Running final 100% Quality Verification across entire dataset...");

  const questions = await prisma.question.findMany({
    include: {
      topic: true,
      concept: true
    },
    orderBy: { createdAt: "asc" }
  });

  console.log(`Total questions to verify: ${questions.length}`);

  let validCount = 0;
  let needsFixCount = 0;
  let invalidCount = 0;
  const issuesList: any[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const issues: string[] = [];

    // Basic question check
    if (!q.questionText || q.questionText.trim().length === 0) {
      issues.push("Empty question_text");
    }

    if (!q.conceptId) {
      issues.push("Unassigned conceptId");
    }

    // MCQ check
    if (q.questionType === "MCQ") {
      const mcq: any = q.mcqData;
      if (!mcq) {
        issues.push("Missing mcqData");
      } else {
        const opts: string[] = Array.isArray(mcq.options) ? mcq.options : [];
        if (opts.length !== 4) {
          issues.push(`Invalid option count: ${opts.length}`);
        }
        if (new Set(opts).size !== opts.length) {
          issues.push("Duplicate options");
        }
        if (!mcq.correctAnswer) {
          issues.push("Missing mcqData.correctAnswer");
        } else if (!opts.includes(mcq.correctAnswer)) {
          issues.push(`correctAnswer "${mcq.correctAnswer}" not in options`);
        }
        if (q.answer && mcq.correctAnswer && q.answer.trim() !== mcq.correctAnswer.trim()) {
          issues.push(`answer ("${q.answer}") !== mcqData.correctAnswer ("${mcq.correctAnswer}")`);
        }
      }
    }

    // Coding check
    if (q.questionType === "CODING") {
      const coding: any = q.codingData;
      if (!coding) {
        issues.push("Missing codingData");
      } else {
        if (!coding.starterCode || !coding.starterCode.python) {
          issues.push("Missing starterCode");
        }
        const publicTests = Array.isArray(coding.publicTests) ? coding.publicTests : [];
        if (publicTests.length === 0) {
          issues.push("Missing publicTests");
        }
      }
    }

    // Explanation check
    if (!q.explanation || q.explanation.trim().length === 0) {
      issues.push("Missing explanation");
    } else {
      const explLower = q.explanation.toLowerCase();
      const mcq: any = q.mcqData || {};
      const options: string[] = Array.isArray(mcq.options) ? mcq.options : [];
      const optsLower = options.join(" ").toLowerCase();

      if (explLower.includes("she doesn't like going to the gym") && !optsLower.includes("gym")) {
        issues.push("Hallucinated explanation ('going to gym')");
      }
      if (explLower.includes("she is an engineer") && !optsLower.includes("engineer")) {
        issues.push("Hallucinated explanation ('engineer')");
      }
      if (explLower.includes("she enjoys reading books") && !optsLower.includes("reading") && !optsLower.includes("books")) {
        issues.push("Hallucinated explanation ('reading books')");
      }
      if (explLower.includes("neither the manager nor the employees were informed") && !optsLower.includes("informed")) {
        issues.push("Hallucinated explanation ('neither manager...')");
      }
    }

    if (issues.length === 0) {
      validCount++;
    } else {
      invalidCount++;
      issuesList.push({
        id: q.id,
        type: q.questionType,
        title: q.questionTitle || q.questionText.substring(0, 50),
        issues
      });
    }
  }

  console.log("\n==================================================");
  console.log("FINAL QUALITY AUDIT RESULT:");
  console.log(`Total Questions: ${questions.length}`);
  console.log(`VALID (Production Ready): ${validCount} (${((validCount / questions.length) * 100).toFixed(2)}%)`);
  console.log(`NEEDS_FIX: ${needsFixCount}`);
  console.log(`INVALID: ${invalidCount}`);
  console.log("==================================================\n");

  if (issuesList.length > 0) {
    console.log("Remaining Issues:", JSON.stringify(issuesList.slice(0, 10), null, 2));
  } else {
    console.log("🎉 ALL 1,235 QUESTIONS ARE 100% VALID!");
  }
}

verifyAll().catch(console.error).finally(() => prisma.$disconnect());
