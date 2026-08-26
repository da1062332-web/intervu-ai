import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

export interface AuditIssue {
  check: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  problem: string;
  expected: string;
  actual: string;
  recommendedFix: string;
}

export interface QuestionAuditRecord {
  id: string;
  type: string;
  topicName?: string;
  topicCode?: string;
  conceptName?: string;
  difficulty: string;
  status: "VALID" | "NEEDS_FIX" | "INVALID";
  highestSeverity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  issues: AuditIssue[];
  questionSnippet: string;
  answerSnippet: string;
}

async function runCompleteAudit() {
  console.log("Running comprehensive quality audit across entire dataset (1,235 questions)...");

  const questions = await prisma.question.findMany({
    include: {
      topic: true,
      concept: true
    },
    orderBy: { createdAt: "asc" }
  });

  const auditRecords: QuestionAuditRecord[] = [];
  const textDuplicatesMap = new Map<string, string[]>();

  // Pass 1: Global duplicate indexing
  for (const q of questions) {
    const norm = (q.questionText || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (norm.length > 8) {
      if (!textDuplicatesMap.has(norm)) textDuplicatesMap.set(norm, []);
      textDuplicatesMap.get(norm)!.push(q.id);
    }
  }

  // Pass 2: Question-by-question audit
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const issues: AuditIssue[] = [];

    // 1. Basic question validation
    if (!q.questionText || q.questionText.trim().length === 0) {
      issues.push({
        check: "BASIC_QUESTION_EMPTY",
        severity: "CRITICAL",
        problem: "question_text is empty or missing",
        expected: "Non-empty string containing clear question text",
        actual: "null / empty",
        recommendedFix: "Provide valid question text or delete corrupt record."
      });
    }

    if (!q.conceptId) {
      issues.push({
        check: "METADATA_CONCEPT_UNASSIGNED",
        severity: "HIGH",
        problem: "concept_id is null / unassigned in database",
        expected: "Valid concept_id linked to Concept table",
        actual: "null",
        recommendedFix: "Link question to appropriate concept under its topic."
      });
    }

    // 2. MCQ Validation
    if (q.questionType === "MCQ") {
      const mcq: any = q.mcqData;
      const meta: any = q.metadata;

      if (!mcq) {
        issues.push({
          check: "MCQ_MISSING_DATA",
          severity: "CRITICAL",
          problem: "mcq_data JSON is completely missing for MCQ question",
          expected: "mcq_data JSON object containing options array and correctAnswer",
          actual: "null",
          recommendedFix: "Populate mcq_data structure."
        });
      } else {
        const options: string[] = Array.isArray(mcq.options) ? mcq.options : [];

        // Check options length
        if (options.length !== 4) {
          issues.push({
            check: "MCQ_INVALID_OPTION_COUNT",
            severity: "CRITICAL",
            problem: `Expected exactly 4 options, found ${options.length}`,
            expected: "Exactly 4 options",
            actual: `${options.length} options: [${options.map(o => `"${o}"`).join(", ")}]`,
            recommendedFix: "Update options list to have exactly 4 plausible choices."
          });
        }

        // Check empty options
        const emptyIdx = options.findIndex(o => !o || String(o).trim().length === 0);
        if (emptyIdx !== -1) {
          issues.push({
            check: "MCQ_EMPTY_OPTION",
            severity: "CRITICAL",
            problem: `Option at index ${emptyIdx} is empty or whitespace`,
            expected: "4 non-empty string options",
            actual: `Option index ${emptyIdx} is empty`,
            recommendedFix: "Fill in option text."
          });
        }

        // Check duplicate options within question
        const uniqueOptions = new Set(options.map(o => String(o).trim().toLowerCase()));
        if (uniqueOptions.size !== options.length) {
          issues.push({
            check: "MCQ_DUPLICATE_OPTIONS",
            severity: "CRITICAL",
            problem: "Contains duplicate options within the same question",
            expected: "4 distinct unique options",
            actual: `Unique count: ${uniqueOptions.size}, Total options: ${options.length}`,
            recommendedFix: "Replace duplicate distractor with a unique plausible option."
          });
        }

        // Check correctAnswer field
        const mcqCorrect = mcq.correctAnswer;
        if (!mcqCorrect || String(mcqCorrect).trim().length === 0) {
          issues.push({
            check: "MCQ_MISSING_CORRECT_ANSWER_FIELD",
            severity: "CRITICAL",
            problem: "mcq_data.correctAnswer is missing or empty in JSON",
            expected: "mcq_data.correctAnswer matching one of the 4 options",
            actual: "null or undefined",
            recommendedFix: "Set mcq_data.correctAnswer to match the question's answer."
          });
        } else {
          const inOptions = options.some(o => String(o).trim() === String(mcqCorrect).trim());
          if (!inOptions) {
            issues.push({
              check: "MCQ_CORRECT_ANSWER_NOT_IN_OPTIONS",
              severity: "CRITICAL",
              problem: `mcq_data.correctAnswer ("${mcqCorrect}") is not present in options array`,
              expected: `correctAnswer must match one of the 4 options exactly`,
              actual: `Options: [${options.map(o => `"${o}"`).join(", ")}]`,
              recommendedFix: "Fix either correctAnswer or options list so they match."
            });
          }
        }

        // Check table answer column vs mcq_data.correctAnswer
        if (q.answer && mcqCorrect) {
          if (String(q.answer).trim() !== String(mcqCorrect).trim()) {
            issues.push({
              check: "MCQ_ANSWER_COLUMN_MISMATCH",
              severity: "CRITICAL",
              problem: `Column 'answer' does not match 'mcq_data.correctAnswer'`,
              expected: `'answer' === 'mcq_data.correctAnswer'`,
              actual: `answer="${q.answer}", mcq_data.correctAnswer="${mcqCorrect}"`,
              recommendedFix: "Synchronize 'answer' and 'mcq_data.correctAnswer'."
            });
          }
        }

        // Check metadata.options vs mcq_data.options
        if (meta && Array.isArray(meta.options)) {
          const metaOpts: string[] = meta.options;
          const sortedMeta = [...metaOpts].sort().join("|||");
          const sortedMcq = [...options].sort().join("|||");
          if (sortedMeta !== sortedMcq) {
            issues.push({
              check: "METADATA_OPTIONS_MISMATCH",
              severity: "HIGH",
              problem: "metadata.options has unformatted/divergent content compared to mcq_data.options",
              expected: "Identical options in metadata.options and mcq_data.options",
              actual: `metadata: [${metaOpts.slice(0, 2).join(", ")}...], mcq_data: [${options.slice(0, 2).join(", ")}...]`,
              recommendedFix: "Synchronize metadata.options with mcq_data.options."
            });
          }
        }
      }
    }

    // 3. Coding validation
    if (q.questionType === "CODING") {
      const coding: any = q.codingData;
      if (!coding) {
        issues.push({
          check: "CODING_MISSING_DATA",
          severity: "CRITICAL",
          problem: "coding_data is null for CODING question",
          expected: "Valid coding_data object with problem statement, test cases, starter code",
          actual: "null",
          recommendedFix: "Populate coding_data."
        });
      } else {
        const title = (q.questionTitle || "").toLowerCase();
        const text = (q.questionText || "").toLowerCase();
        const starterCode = coding.starterCode || {};
        const starterCpp = (starterCode.cpp || "").toLowerCase();
        const starterPython = (starterCode.python || "").toLowerCase();
        const publicTests = Array.isArray(coding.publicTests) ? coding.publicTests : [];
        const hiddenTests = Array.isArray(coding.hiddenTests) ? coding.hiddenTests : [];

        // Check for starter code mismatch (e.g. rotate function in non-rotation problem)
        if (starterCpp.includes("rotate") && !title.includes("rotate") && !text.includes("rotate")) {
          issues.push({
            check: "CODING_STARTER_CODE_MISMATCH",
            severity: "CRITICAL",
            problem: "Starter code contains dummy 'rotate' boilerplate unrelated to problem statement",
            expected: `Function signature matching problem "${q.questionTitle}"`,
            actual: `starterCode has 'rotate(vector<int>& arr, int k)'`,
            recommendedFix: "Regenerate starter code template tailored to this problem."
          });
        }

        // Check for test case mismatch (e.g. test input is {"n": 19} for an array or discount problem)
        if (publicTests.length > 0) {
          const sampleInput = publicTests[0].input || {};
          if (sampleInput.n !== undefined && (title.includes("array") || title.includes("discount") || title.includes("cell") || title.includes("string") || text.includes("arr"))) {
            issues.push({
              check: "CODING_TEST_CASE_MISMATCH",
              severity: "CRITICAL",
              problem: "Public and hidden test cases test a dummy 'n * 2' function instead of the actual problem requirements",
              expected: `Test cases matching examples and constraints in problem statement`,
              actual: `Input: ${JSON.stringify(sampleInput)}, Output: ${JSON.stringify(publicTests[0].expectedOutput)}`,
              recommendedFix: "Regenerate valid oracle and test suite corresponding to problem statement."
            });
          }
        }
      }
    }

    // 4. Explanation validation
    if (!q.explanation || q.explanation.trim().length === 0) {
      issues.push({
        check: "EXPLANATION_MISSING",
        severity: "HIGH",
        problem: "Explanation is missing or empty",
        expected: "Step-by-step reasoning explaining the correct answer",
        actual: "Empty",
        recommendedFix: "Generate clear step-by-step explanation."
      });
    } else {
      const expl = q.explanation;
      const explLower = expl.toLowerCase();
      const mcq: any = q.mcqData || {};
      const options: string[] = Array.isArray(mcq.options) ? mcq.options : [];
      const optsLower = options.join(" ").toLowerCase();

      // Check known hallucinated explanation patterns
      if (explLower.includes("she doesn't like going to the gym") && !optsLower.includes("gym")) {
        issues.push({
          check: "EXPLANATION_HALLUCINATION",
          severity: "CRITICAL",
          problem: "Explanation describes unrelated sentence ('going to the gym')",
          expected: `Explanation for "${q.answer}"`,
          actual: expl.substring(0, 120) + "...",
          recommendedFix: "Regenerate explanation matching actual question text and options."
        });
      }
      if (explLower.includes("she is an engineer") && !optsLower.includes("engineer")) {
        issues.push({
          check: "EXPLANATION_HALLUCINATION",
          severity: "CRITICAL",
          problem: "Explanation describes unrelated question ('She is an engineer' / article usage)",
          expected: `Explanation for "${q.answer}"`,
          actual: expl.substring(0, 120) + "...",
          recommendedFix: "Regenerate explanation matching actual question text and options."
        });
      }
      if (explLower.includes("she enjoys reading books") && !optsLower.includes("reading") && !optsLower.includes("books")) {
        issues.push({
          check: "EXPLANATION_HALLUCINATION",
          severity: "CRITICAL",
          problem: "Explanation describes unrelated question ('She enjoys reading books')",
          expected: `Explanation for "${q.answer}"`,
          actual: expl.substring(0, 120) + "...",
          recommendedFix: "Regenerate explanation matching actual question text and options."
        });
      }
      if (explLower.includes("neither the manager nor the employees were informed") && !optsLower.includes("informed")) {
        issues.push({
          check: "EXPLANATION_HALLUCINATION",
          severity: "CRITICAL",
          problem: "Explanation describes unrelated question ('Neither the manager nor the employees were informed')",
          expected: `Explanation for "${q.answer}"`,
          actual: expl.substring(0, 120) + "...",
          recommendedFix: "Regenerate explanation matching actual question text and options."
        });
      }

      // Option letter index mismatch
      if (q.questionType === "MCQ" && options.length === 4 && q.answer) {
        const actualAnsIdx = options.indexOf(q.answer);
        if (actualAnsIdx !== -1) {
          const letterMatch = expl.match(/(?:option|answer is:?)\s+([A-D]|1-4)\b/i);
          if (letterMatch) {
            const statedLetter = letterMatch[1].toUpperCase();
            let statedIdx = -1;
            if (statedLetter === "A" || statedLetter === "1") statedIdx = 0;
            else if (statedLetter === "B" || statedLetter === "2") statedIdx = 1;
            else if (statedLetter === "C" || statedLetter === "3") statedIdx = 2;
            else if (statedLetter === "D" || statedLetter === "4") statedIdx = 3;

            if (statedIdx !== -1 && statedIdx !== actualAnsIdx) {
              issues.push({
                check: "EXPLANATION_OPTION_LETTER_MISMATCH",
                severity: "MEDIUM",
                problem: `Explanation cites Option ${statedLetter} (Index ${statedIdx + 1}), but the correct answer is Option ${String.fromCharCode(65 + actualAnsIdx)} (Index ${actualAnsIdx + 1})`,
                expected: `Option ${String.fromCharCode(65 + actualAnsIdx)}: "${q.answer}"`,
                actual: `Explanation references Option ${statedLetter}`,
                recommendedFix: `Update explanation text to reference Option ${String.fromCharCode(65 + actualAnsIdx)}.`
              });
            }
          }
        }
      }
    }

    // 5. Duplicate Question Check
    const norm = (q.questionText || "").trim().toLowerCase().replace(/\s+/g, " ");
    const dupIds = textDuplicatesMap.get(norm) || [];
    if (dupIds.length > 1) {
      const otherDups = dupIds.filter(id => id !== q.id);
      issues.push({
        check: "DUPLICATE_QUESTION",
        severity: "HIGH",
        problem: `Exact duplicate question text found across ${dupIds.length} records in database`,
        expected: "Unique questions across dataset",
        actual: `Duplicate IDs: ${otherDups.slice(0, 3).join(", ")}${otherDups.length > 3 ? "..." : ""}`,
        recommendedFix: "Keep one canonical question and deduplicate."
      });
    }

    // Determine final status
    let status: "VALID" | "NEEDS_FIX" | "INVALID" = "VALID";
    let highestSev: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | undefined = undefined;

    const criticalCount = issues.filter(i => i.severity === "CRITICAL").length;
    const highCount = issues.filter(i => i.severity === "HIGH").length;
    const medLowCount = issues.filter(i => i.severity === "MEDIUM" || i.severity === "LOW").length;

    if (criticalCount > 0) {
      status = "INVALID";
      highestSev = "CRITICAL";
    } else if (highCount > 0) {
      status = "NEEDS_FIX";
      highestSev = "HIGH";
    } else if (medLowCount > 0) {
      status = "NEEDS_FIX";
      highestSev = issues.some(i => i.severity === "MEDIUM") ? "MEDIUM" : "LOW";
    }

    auditRecords.push({
      id: q.id,
      type: q.questionType,
      topicName: q.topic?.name,
      topicCode: q.topic?.code,
      conceptName: q.concept?.name,
      difficulty: q.difficulty,
      status,
      highestSeverity: highestSev,
      issues,
      questionSnippet: (q.questionText || "").substring(0, 80),
      answerSnippet: (q.answer || "").substring(0, 80)
    });
  }

  fs.writeFileSync("final_audit_records.json", JSON.stringify(auditRecords, null, 2), "utf-8");

  const validCount = auditRecords.filter(r => r.status === "VALID").length;
  const needsFixCount = auditRecords.filter(r => r.status === "NEEDS_FIX").length;
  const invalidCount = auditRecords.filter(r => r.status === "INVALID").length;

  console.log(`\nAUDIT COMPLETE:`);
  console.log(`Total: ${auditRecords.length}`);
  console.log(`VALID: ${validCount}`);
  console.log(`NEEDS_FIX: ${needsFixCount}`);
  console.log(`INVALID: ${invalidCount}`);
}

runCompleteAudit().catch(console.error).finally(() => prisma.$disconnect());
