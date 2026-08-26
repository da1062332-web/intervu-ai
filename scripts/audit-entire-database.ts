import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

interface AuditIssue {
  check: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  problem: string;
  expected: string;
  actual: string;
  recommendedFix: string;
}

interface QuestionAuditResult {
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

async function main() {
  console.log("Fetching all questions from database...");
  const questions = await prisma.question.findMany({
    include: {
      topic: true,
      concept: true
    },
    orderBy: { createdAt: "asc" }
  });

  console.log(`Fetched ${questions.length} total questions. Beginning rigorous multi-point audit...\n`);

  const results: QuestionAuditResult[] = [];
  const textDuplicatesMap = new Map<string, string[]>();
  const optionsDuplicatesMap = new Map<string, string[]>();

  // First pass: Index for duplicate detection
  for (const q of questions) {
    const normText = (q.questionText || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (normText.length > 10) {
      if (!textDuplicatesMap.has(normText)) {
        textDuplicatesMap.set(normText, []);
      }
      textDuplicatesMap.get(normText)!.push(q.id);
    }

    if (q.questionType === "MCQ" && q.mcqData) {
      const mcq: any = q.mcqData;
      const opts = Array.isArray(mcq.options) ? mcq.options : [];
      if (opts.length > 0) {
        const sortedOptsKey = [...opts].map((o: any) => String(o).trim().toLowerCase()).sort().join("|||");
        if (!optionsDuplicatesMap.has(sortedOptsKey)) {
          optionsDuplicatesMap.set(sortedOptsKey, []);
        }
        optionsDuplicatesMap.get(sortedOptsKey)!.push(q.id);
      }
    }
  }

  // Second pass: Comprehensive validation of each question
  for (let idx = 0; idx < questions.length; idx++) {
    const q = questions[idx];
    const issues: AuditIssue[] = [];

    // ==========================================
    // 1. BASIC QUESTION VALIDATION
    // ==========================================
    if (!q.questionText || q.questionText.trim().length === 0) {
      issues.push({
        check: "BASIC_QUESTION",
        severity: "CRITICAL",
        problem: "question_text is empty or missing",
        expected: "Non-empty string containing clear question text",
        actual: `Empty or null`,
        recommendedFix: "Provide valid question text or delete corrupt record."
      });
    } else if (q.questionText.trim().length < 5) {
      issues.push({
        check: "BASIC_QUESTION",
        severity: "HIGH",
        problem: "question_text is excessively short / incomplete",
        expected: "Complete question text",
        actual: q.questionText,
        recommendedFix: "Flesh out the question text."
      });
    }

    if (!q.conceptId) {
      issues.push({
        check: "METADATA_INTEGRITY",
        severity: "HIGH",
        problem: "concept_id is null / unassigned",
        expected: "Valid concept_id linked to Concept table",
        actual: "null",
        recommendedFix: "Link question to appropriate concept under its topic."
      });
    }

    // ==========================================
    // 2. MCQ VALIDATION
    // ==========================================
    if (q.questionType === "MCQ") {
      const mcq: any = q.mcqData;
      const meta: any = q.metadata;

      if (!mcq) {
        issues.push({
          check: "MCQ_STRUCTURE",
          severity: "CRITICAL",
          problem: "mcq_data column is null or missing for MCQ question type",
          expected: "mcq_data JSON object containing options and correctAnswer",
          actual: "null",
          recommendedFix: "Populate mcq_data or change questionType."
        });
      } else {
        const options: string[] = Array.isArray(mcq.options) ? mcq.options : [];

        // Check option count
        if (options.length !== 4) {
          issues.push({
            check: "MCQ_OPTIONS_COUNT",
            severity: "CRITICAL",
            problem: `Question has ${options.length} options instead of exactly 4`,
            expected: "Exactly 4 options",
            actual: `${options.length} options: [${options.map(o => `"${o}"`).join(", ")}]`,
            recommendedFix: "Adjust options list to have exactly 4 plausible choices."
          });
        }

        // Check empty options
        const emptyOptIndex = options.findIndex(o => !o || String(o).trim().length === 0);
        if (emptyOptIndex !== -1) {
          issues.push({
            check: "MCQ_EMPTY_OPTION",
            severity: "CRITICAL",
            problem: `Option at index ${emptyOptIndex} is empty`,
            expected: "4 non-empty string options",
            actual: `Option ${emptyOptIndex} is empty or whitespace`,
            recommendedFix: "Provide text for the empty option."
          });
        }

        // Check duplicate options within question
        const uniqueSet = new Set(options.map(o => String(o).trim().toLowerCase()));
        if (uniqueSet.size !== options.length) {
          issues.push({
            check: "MCQ_DUPLICATE_OPTIONS",
            severity: "CRITICAL",
            problem: "Contains duplicate options within the same question",
            expected: "4 distinct unique options",
            actual: `Unique count: ${uniqueSet.size}, Total options: ${options.length}`,
            recommendedFix: "Replace duplicate distractor with a unique plausible option."
          });
        }

        // Check correctAnswer field
        const mcqCorrect = mcq.correctAnswer;
        if (!mcqCorrect || String(mcqCorrect).trim().length === 0) {
          issues.push({
            check: "MCQ_CORRECT_ANSWER_FIELD",
            severity: "CRITICAL",
            problem: "mcq_data.correctAnswer is missing or empty",
            expected: "mcq_data.correctAnswer matching one option",
            actual: "null or empty",
            recommendedFix: "Set mcq_data.correctAnswer."
          });
        } else {
          // Check if correctAnswer is in options
          const inOptions = options.some(o => String(o).trim() === String(mcqCorrect).trim());
          if (!inOptions) {
            issues.push({
              check: "MCQ_ANSWER_NOT_IN_OPTIONS",
              severity: "CRITICAL",
              problem: `mcq_data.correctAnswer ("${mcqCorrect}") is not present in options array`,
              expected: `correctAnswer must exactly match one of the options`,
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
          if (JSON.stringify(metaOpts) !== JSON.stringify(options)) {
            // Check if it's just order or different content
            const sortedMeta = [...metaOpts].sort().join("|||");
            const sortedMcq = [...options].sort().join("|||");
            if (sortedMeta !== sortedMcq) {
              issues.push({
                check: "METADATA_OPTIONS_MISMATCH",
                severity: "HIGH",
                problem: "metadata.options has different option content than mcq_data.options",
                expected: "Identical options in metadata and mcq_data",
                actual: `metadata: [${metaOpts.join(", ")}], mcq_data: [${options.join(", ")}]`,
                recommendedFix: "Update metadata.options to mirror mcq_data.options."
              });
            } else {
              issues.push({
                check: "METADATA_ORDER_MISMATCH",
                severity: "LOW",
                problem: "metadata.options has different ordering than mcq_data.options",
                expected: "Consistent ordering",
                actual: "Shuffled order in metadata",
                recommendedFix: "Align ordering in metadata."
              });
            }
          }
        }
      }
    }

    // ==========================================
    // 3. CODING QUESTION VALIDATION
    // ==========================================
    if (q.questionType === "CODING") {
      const coding: any = q.codingData;
      if (!coding) {
        issues.push({
          check: "CODING_STRUCTURE",
          severity: "CRITICAL",
          problem: "coding_data is null for CODING question",
          expected: "Valid coding_data object with problem statement, test cases, starter code",
          actual: "null",
          recommendedFix: "Populate coding_data or change questionType."
        });
      } else {
        if (!coding.problemStatement && !q.questionStatement && !q.questionText) {
          issues.push({
            check: "CODING_STATEMENT",
            severity: "CRITICAL",
            problem: "Missing problem statement in coding question",
            expected: "Detailed problem description with input/output specs",
            actual: "Empty",
            recommendedFix: "Add problemStatement."
          });
        }

        // Check test cases
        const sampleTests = Array.isArray(coding.sampleTestCases) ? coding.sampleTestCases : [];
        const hiddenTests = Array.isArray(coding.hiddenTestCases) ? coding.hiddenTestCases : [];
        const allTests = [...sampleTests, ...hiddenTests];

        if (allTests.length === 0) {
          issues.push({
            check: "CODING_TEST_CASES",
            severity: "CRITICAL",
            problem: "No test cases found in coding_data",
            expected: "At least 2 sample test cases and 5+ hidden test cases",
            actual: "0 test cases",
            recommendedFix: "Add comprehensive sample and hidden test cases."
          });
        } else {
          for (let tIdx = 0; tIdx < allTests.length; tIdx++) {
            const tc = allTests[tIdx];
            if (tc.input === undefined || tc.expectedOutput === undefined || tc.input === null || tc.expectedOutput === null) {
              issues.push({
                check: "CODING_TEST_CASE_FORMAT",
                severity: "HIGH",
                problem: `Test case #${tIdx + 1} has missing input or expectedOutput`,
                expected: "Valid input and expectedOutput fields",
                actual: JSON.stringify(tc),
                recommendedFix: "Provide valid input and expectedOutput."
              });
            }
          }
        }

        // Check starter code
        if (!coding.starterCode && !coding.functionSignature) {
          issues.push({
            check: "CODING_STARTER_CODE",
            severity: "MEDIUM",
            problem: "Missing starter code or function signature in coding_data",
            expected: "Starter code boilerplate in supported languages",
            actual: "Missing",
            recommendedFix: "Add starter code templates."
          });
        }
      }
    }

    // ==========================================
    // 4. EXPLANATION VALIDATION
    // ==========================================
    if (!q.explanation || q.explanation.trim().length === 0) {
      issues.push({
        check: "EXPLANATION_EXISTENCE",
        severity: "HIGH",
        problem: "Explanation is missing or empty",
        expected: "Clear step-by-step solution and reasoning",
        actual: "Empty",
        recommendedFix: "Generate step-by-step explanation."
      });
    } else {
      const expl = q.explanation;
      const explLower = expl.toLowerCase();
      const qLower = (q.questionText || "").toLowerCase();
      const ansLower = (q.answer || "").toLowerCase();
      const mcq: any = q.mcqData || {};
      const options: string[] = Array.isArray(mcq.options) ? mcq.options : [];
      const optsLower = options.join(" ").toLowerCase();

      // Check hallucinated explanations (Specific keywords that belong to other questions)
      if (explLower.includes("she doesn't like going to the gym") && !optsLower.includes("gym")) {
        issues.push({
          check: "EXPLANATION_HALLUCINATION",
          severity: "CRITICAL",
          problem: "Explanation describes unrelated question ('going to the gym')",
          expected: `Explanation addressing "${q.answer}"`,
          actual: expl.substring(0, 150) + "...",
          recommendedFix: "Regenerate explanation matching actual question text and options."
        });
      }

      if (explLower.includes("she is an engineer") && !optsLower.includes("engineer")) {
        issues.push({
          check: "EXPLANATION_HALLUCINATION",
          severity: "CRITICAL",
          problem: "Explanation describes unrelated question ('She is an engineer' / article usage)",
          expected: `Explanation addressing "${q.answer}"`,
          actual: expl.substring(0, 150) + "...",
          recommendedFix: "Regenerate explanation matching actual question text and options."
        });
      }

      if (explLower.includes("she enjoys reading books") && !optsLower.includes("reading") && !optsLower.includes("books")) {
        issues.push({
          check: "EXPLANATION_HALLUCINATION",
          severity: "CRITICAL",
          problem: "Explanation describes unrelated question ('She enjoys reading books')",
          expected: `Explanation addressing "${q.answer}"`,
          actual: expl.substring(0, 150) + "...",
          recommendedFix: "Regenerate explanation matching actual question text and options."
        });
      }

      if (explLower.includes("neither the manager nor the employees were informed") && !optsLower.includes("informed")) {
        issues.push({
          check: "EXPLANATION_HALLUCINATION",
          severity: "CRITICAL",
          problem: "Explanation describes unrelated question ('Neither the manager nor the employees were informed')",
          expected: `Explanation addressing "${q.answer}"`,
          actual: expl.substring(0, 150) + "...",
          recommendedFix: "Regenerate explanation matching actual question text and options."
        });
      }

      // Check option letter mismatch in explanation (e.g. "Final answer is option B" vs actual answer index)
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
                problem: `Explanation cites Option ${statedLetter} (Index ${statedIdx + 1}), but the correct answer is located at Option ${String.fromCharCode(65 + actualAnsIdx)} (Index ${actualAnsIdx + 1})`,
                expected: `Option ${String.fromCharCode(65 + actualAnsIdx)}: "${q.answer}"`,
                actual: `Explanation says Option ${statedLetter}`,
                recommendedFix: `Update explanation text to reference Option ${String.fromCharCode(65 + actualAnsIdx)} or reference answer text directly.`
              });
            }
          }
        }
      }
    }

    // ==========================================
    // 5. DUPLICATE QUESTION VALIDATION
    // ==========================================
    const normText = (q.questionText || "").trim().toLowerCase().replace(/\s+/g, " ");
    const dupIds = textDuplicatesMap.get(normText) || [];
    if (dupIds.length > 1) {
      const otherDups = dupIds.filter(id => id !== q.id);
      issues.push({
        check: "DUPLICATE_QUESTION",
        severity: "HIGH",
        problem: `Exact duplicate question text found in ${dupIds.length} records`,
        expected: "Unique questions across dataset",
        actual: `Duplicate IDs: ${otherDups.join(", ")}`,
        recommendedFix: "Keep one canonical question and remove/replace redundant duplicates."
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

    results.push({
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

  // Compile statistics
  const total = results.length;
  const valid = results.filter(r => r.status === "VALID").length;
  const needsFix = results.filter(r => r.status === "NEEDS_FIX").length;
  const invalid = results.filter(r => r.status === "INVALID").length;

  console.log("================ AUDIT SUMMARY ================");
  console.log(`Total Questions: ${total}`);
  console.log(`VALID: ${valid} (${((valid / total) * 100).toFixed(1)}%)`);
  console.log(`NEEDS_FIX: ${needsFix} (${((needsFix / total) * 100).toFixed(1)}%)`);
  console.log(`INVALID: ${invalid} (${((invalid / total) * 100).toFixed(1)}%)`);

  fs.writeFileSync("entire_dataset_audit_results.json", JSON.stringify(results, null, 2), "utf-8");
  console.log("Wrote full audit results to entire_dataset_audit_results.json");
}

main().catch(console.error).finally(() => prisma.$disconnect());
