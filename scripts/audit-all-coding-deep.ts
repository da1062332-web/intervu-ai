import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

async function auditAllCoding() {
  console.log("==================================================================");
  console.log("DEEP QUALITY AUDIT OF ALL CODING QUESTIONS ACROSS DATABASE");
  console.log("==================================================================");

  // 1. Audit Question table
  const codingQuestions = await prisma.question.findMany({
    where: { questionType: "CODING" },
    include: { topic: true, concept: true }
  });

  console.log(`\nFound ${codingQuestions.length} CODING questions in Question table.\n`);

  const results: any[] = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < codingQuestions.length; i++) {
    const q = codingQuestions[i];
    const issues: string[] = [];
    const coding: any = q.codingData || {};

    const title = q.questionTitle || "";
    const text = q.questionText || "";

    // 1. Check Problem Statement
    if (!text || text.trim().length < 20) {
      issues.push("Problem statement is missing or too short");
    }

    // 2. Check Starter Code
    const starter = coding.starterCode;
    if (!starter || typeof starter !== "object") {
      issues.push("Missing starterCode object in codingData");
    } else {
      if (!starter.python || !starter.python.includes("def ")) {
        issues.push("Missing or invalid Python starter code");
      }
      if (!starter.javascript || !starter.javascript.includes("function ")) {
        issues.push("Missing or invalid JavaScript starter code");
      }
      if (!starter.java || !starter.java.includes("class Solution")) {
        issues.push("Missing or invalid Java starter code");
      }
      if (!starter.cpp || !starter.cpp.includes("class Solution")) {
        issues.push("Missing or invalid C++ starter code");
      }

      // Check for leftover dummy 'rotate' boilerplate on non-rotation problems
      const titleLower = title.toLowerCase();
      const textLower = text.toLowerCase();
      if (
        (starter.cpp?.includes("rotate(vector") || starter.python?.includes("def rotate(")) &&
        !titleLower.includes("rotate") &&
        !textLower.includes("rotate")
      ) {
        issues.push("Starter code contains dummy 'rotate' signature for non-rotation problem");
      }
    }

    // 3. Check Public Tests
    const publicTests = Array.isArray(coding.publicTests) ? coding.publicTests : [];
    if (publicTests.length === 0) {
      issues.push("Missing publicTests");
    } else {
      for (let t = 0; t < publicTests.length; t++) {
        const pt = publicTests[t];
        if (pt.input === undefined || pt.expectedOutput === undefined) {
          issues.push(`publicTests[${t}] missing input or expectedOutput`);
        }
      }
    }

    // 4. Check Hidden Tests
    const hiddenTests = Array.isArray(coding.hiddenTests) ? coding.hiddenTests : [];
    if (hiddenTests.length === 0) {
      issues.push("Missing hiddenTests");
    } else {
      for (let t = 0; t < hiddenTests.length; t++) {
        const ht = hiddenTests[t];
        if (ht.input === undefined || ht.expectedOutput === undefined) {
          issues.push(`hiddenTests[${t}] missing input or expectedOutput`);
        }
      }
    }

    // 5. Check Boundary Tests
    const boundaryTests = Array.isArray(coding.boundaryTests) ? coding.boundaryTests : [];
    if (boundaryTests.length === 0) {
      issues.push("Missing boundaryTests");
    }

    // 6. Check Stress Tests
    const stressTests = Array.isArray(coding.stressTests) ? coding.stressTests : [];
    if (stressTests.length === 0) {
      issues.push("Missing stressTests");
    }

    // 7. Check Test Case Input/Parameter Consistency
    // E.g. Check if input keys match function parameters
    if (publicTests.length > 0) {
      const sampleInput = publicTests[0].input;
      if (typeof sampleInput === "object" && sampleInput !== null) {
        const inputKeys = Object.keys(sampleInput);
        if (starter?.python) {
          for (const key of inputKeys) {
            if (!starter.python.includes(key)) {
              issues.push(`Python starter code parameter list missing input key '${key}'`);
            }
          }
        }
      }
    }

    if (issues.length === 0) {
      validCount++;
    } else {
      invalidCount++;
    }

    results.push({
      num: i + 1,
      id: q.id,
      title,
      topic: q.topic?.name,
      functionName: coding.functionName,
      publicTestsCount: publicTests.length,
      hiddenTestsCount: hiddenTests.length,
      boundaryTestsCount: boundaryTests.length,
      stressTestsCount: stressTests.length,
      languagesSupported: starter ? Object.keys(starter) : [],
      status: issues.length === 0 ? "VALID" : "INVALID",
      issues
    });
  }

  console.log("=== CODING QUESTIONS AUDIT SUMMARY ===");
  console.log(`Total Coding Questions: ${codingQuestions.length}`);
  console.log(`VALID (100% Complete & Consistent): ${validCount} (${((validCount / codingQuestions.length) * 100).toFixed(2)}%)`);
  console.log(`INVALID: ${invalidCount}`);

  fs.writeFileSync("coding_questions_deep_audit.json", JSON.stringify(results, null, 2), "utf-8");
  console.log("Saved report to coding_questions_deep_audit.json");

  // Also check TestInstanceQuestion snapshots for Coding
  const allTiqCoding = await prisma.testInstanceQuestion.findMany({
    include: { section: true }
  });
  let tiqCodingValid = 0;
  let tiqCodingBroken = 0;
  for (const tiq of allTiqCoding) {
    const snap: any = tiq.questionSnapshot || {};
    const isCoding = (tiq.section?.sectionName || "").toLowerCase().includes("coding") || snap.questionType === "CODING";
    if (isCoding) {
      if (snap.codingData && snap.codingData.starterCode) {
        tiqCodingValid++;
      } else {
        tiqCodingBroken++;
      }
    }
  }
  console.log(`\nTestInstanceQuestion Coding Snapshots: ${tiqCodingValid + tiqCodingBroken} total (${tiqCodingValid} with codingData, ${tiqCodingBroken} missing codingData)`);
}

auditAllCoding().catch(console.error).finally(() => prisma.$disconnect());
