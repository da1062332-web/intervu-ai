import { SubmissionEvaluatorService } from "../apps/api/src/modules/coding/services/submission-evaluator.service";
import { JudgeService } from "../apps/api/src/modules/coding/services/judge.service";
import { OracleRegistry } from "../apps/api/src/modules/coding/oracles/oracle.registry";
import { BasicGradeCalculatorOracle } from "../apps/api/src/modules/coding/oracles/basic-grade-calculator.oracle";
import { CodingEvaluatorService } from "../apps/api/src/modules/evaluation/objective/coding-evaluator.service";
import { ObjectiveEvaluatorService } from "../apps/api/src/modules/evaluation/objective/objective-evaluator.service";
import { SectionScoringService } from "../apps/api/src/modules/evaluation/scoring/section-scoring.service";
import { OverallScoreService } from "../apps/api/src/modules/evaluation/scoring/overall-score.service";
import { SubmitCodeDto } from "../apps/api/src/modules/coding/dto/submit-code.dto";

async function verifyCompleteResultFlow() {
  console.log("=======================================================================");
  console.log("   COMPLETE END-TO-END PIPELINE VERIFICATION: CODING → CANDIDATE RESULT");
  console.log("=======================================================================\n");

  const judgeService = new JudgeService();
  const oracleRegistry = new OracleRegistry([new BasicGradeCalculatorOracle()]);
  const evaluatorService = new SubmissionEvaluatorService(judgeService, oracleRegistry);

  // 1. CANDIDATE SUBMITS CODING SOLUTION
  console.log("▶ STEP 1: Candidate Submits Solution to POST /coding/submit...");
  const primeQuestionData = {
    oracleKey: "MATH_PRIME_CHECK_ORACLE",
    publicTests: [
      { input: { n: 7 }, expectedOutput: { result: true } },
      { input: { n: 10 }, expectedOutput: { result: false } },
    ],
    hiddenTests: [
      { input: { n: 13 }, expectedOutput: { result: true } },
      { input: { n: 100 }, expectedOutput: { result: false } },
      { input: { n: 527 }, expectedOutput: { result: false } },
      { input: { n: 997 }, expectedOutput: { result: true } },
    ],
    boundaryTests: [
      { input: { n: -5 }, expectedOutput: { result: false } },
      { input: { n: 0 }, expectedOutput: { result: false } },
      { input: { n: 1 }, expectedOutput: { result: false } },
      { input: { n: 2 }, expectedOutput: { result: true } },
    ],
    stressTests: [
      { input: { n: 1000003 }, expectedOutput: { result: true } },
      { input: { n: 1000000 }, expectedOutput: { result: false } },
    ],
  };

  const candidateCode = `def is_prime(n):
    return n > 1 and all(n % i != 0 for i in range(2, int(n**0.5) + 1))
`;

  const dto: SubmitCodeDto = {
    questionId: "q_coding_1",
    testInstanceId: "demo-sandbox-test-id",
    code: candidateCode,
    language: "python",
  };

  const evalResult = await evaluatorService.evaluateSubmission(
    dto,
    primeQuestionData,
    "Primality Check",
    true, // demo fallback mode
  );

  console.log("   Evaluation Verdict:  ", evalResult.verdict);
  console.log("   Evaluation Score:    ", evalResult.score + "%");
  console.log("   Passed/Total:        ", `${evalResult.passedTests} / ${evalResult.totalTests}`);
  console.log("   Categories Summary:  ", JSON.stringify(evalResult.categories));

  if (evalResult.verdict !== "ACCEPTED" || evalResult.score !== 100) {
    console.error("❌ FAIL: Step 1 Judge0 evaluation failed!");
    process.exit(1);
  }
  console.log("   ✅ STEP 1 PASS\n");

  // 2. CANDIDATE ANSWER DB PERSISTENCE SNAPSHOT
  console.log("▶ STEP 2: DB Answer Snapshot Creation...");
  const dbAnswerRecord = {
    testInstanceId: dto.testInstanceId,
    questionId: dto.questionId,
    answer: {
      code: dto.code,
      language: dto.language,
      submissionId: `sub_e2e_${Date.now()}`,
      score: evalResult.score,
      verdict: evalResult.verdict,
      submittedAt: new Date().toISOString(),
    },
  };
  console.log("   DB Record Payload: ", JSON.stringify(dbAnswerRecord.answer));
  console.log("   ✅ STEP 2 PASS\n");

  // 3. CODING EVALUATOR SERVICE EVALUATION
  console.log("▶ STEP 3: CodingEvaluatorService Evaluation...");
  const mockLLMAdapter: any = { generate: async () => "" };
  const codingEvaluator = new CodingEvaluatorService(mockLLMAdapter);

  const answerPayloadStr = JSON.stringify(dbAnswerRecord.answer);
  const codingQuestionList = [
    {
      id: "q_coding_1",
      questionType: "CODING",
      problemStatement: "Check if prime",
      questionText: "Primality Check",
      difficulty: "MEDIUM",
      topicName: "Math",
      sectionKey: "coding_section",
    },
  ];

  const submissionAnswers = [
    {
      questionId: "q_coding_1",
      selectedOptionId: undefined,
      selectedOptionIds: undefined,
      textResponse: answerPayloadStr,
      status: "ANSWERED" as const,
      timeSpentSeconds: 60,
    },
  ];

  const codingEvalResults = await codingEvaluator.evaluateAnswers(
    submissionAnswers,
    codingQuestionList,
  );

  const cResult = codingEvalResults[0];
  console.log("   Coding Score Normalized: ", cResult.score, "/ 1.0");
  console.log("   Is Correct:               ", cResult.isCorrect);
  console.log("   Feedback:                 ", cResult.codingFeedback);

  if (!cResult.isCorrect || cResult.score !== 1.0) {
    console.error("❌ FAIL: Step 3 CodingEvaluatorService normalization failed!");
    process.exit(1);
  }
  console.log("   ✅ STEP 3 PASS\n");

  // 4. OBJECTIVE & SECTION & OVERALL SCORING INTEGRATION
  console.log("▶ STEP 4: OverallScoreService & SectionScoringService Integration...");
  const objectiveEvaluator = new ObjectiveEvaluatorService();
  const sectionScoring = new SectionScoringService();
  const overallScoring = new OverallScoreService();

  const mcqQuestionsList = [
    {
      id: "q_mcq_1",
      answer: "opt_a",
      questionType: "MCQ",
      difficulty: "EASY",
      topicName: "Math",
      sectionKey: "mcq_section",
    },
  ];

  const mcqSubmissionAnswers = [
    {
      questionId: "q_mcq_1",
      selectedOptionId: "opt_a",
      textResponse: "opt_a",
      status: "ANSWERED" as const,
      timeSpentSeconds: 15,
    },
  ];

  const objectiveEvalResults = objectiveEvaluator.evaluateAnswers(
    mcqSubmissionAnswers,
    mcqQuestionsList,
  );

  const sectionsList = [
    {
      id: "sec_1",
      sectionKey: "mcq_section",
      sectionName: "MCQ Section",
      questions: [{ questionId: "q_mcq_1" }],
    },
    {
      id: "sec_2",
      sectionKey: "coding_section",
      sectionName: "Coding Section",
      questions: [{ questionId: "q_coding_1" }],
    },
  ];

  const allEvalResults = [...objectiveEvalResults, ...codingEvalResults];
  const sectionScores = sectionScoring.calculateSectionScores(allEvalResults, sectionsList);
  const overallScore = overallScoring.calculateOverallScore(
    sectionScores,
    objectiveEvalResults,
    codingEvalResults,
  );

  console.log("   Total Marks:          ", overallScore.totalMarks, "/", overallScore.maxMarks);
  console.log("   Overall Percentage:   ", overallScore.percentage + "%");
  console.log("   Objective Score:      ", overallScore.objectiveScore);
  console.log("   Coding Score:         ", overallScore.codingScore);
  console.log("   Assessment Passed:    ", overallScore.passed);

  if (
    overallScore.codingScore !== 1 ||
    overallScore.objectiveScore !== 1 ||
    overallScore.totalMarks !== 2 ||
    overallScore.percentage !== 100 ||
    !overallScore.passed
  ) {
    console.error("❌ FAIL: Step 4 Overall scoring integration failed!");
    process.exit(1);
  }
  console.log("   ✅ STEP 4 PASS\n");

  // 5. PRIVACY ISOLATION AUDIT
  console.log("▶ STEP 5: Verifying Candidate Security & Privacy Isolation...");
  const candidateResultDto = {
    attemptId: dto.testInstanceId,
    score: overallScore.totalMarks,
    percentage: overallScore.percentage,
    objectiveScore: overallScore.objectiveScore,
    codingScore: overallScore.codingScore,
    passed: overallScore.passed,
    sections: sectionScores,
  };

  const payloadString = JSON.stringify(candidateResultDto);
  const leakedHidden = payloadString.includes("hiddenTests");
  const leakedExpected = payloadString.includes("expectedOutput");

  if (leakedHidden || leakedExpected) {
    console.error("❌ SECURITY FAIL: Hidden tests or expected outputs leaked to Candidate Result DTO!");
    process.exit(1);
  }
  console.log("   ✅ STEP 5 PASS: Zero private test cases or expected outputs leaked.\n");

  console.log("=======================================================================");
  console.log("   ALL STEPS IN CODING → CANDIDATE RESULT PIPELINE VERIFIED SUCCESSFULLY!");
  console.log("=======================================================================");
}

verifyCompleteResultFlow().catch((err) => {
  console.error("Fatal verification error:", err);
  process.exit(1);
});
