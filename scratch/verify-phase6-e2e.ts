import { SubmissionEvaluatorService } from "../apps/api/src/modules/coding/services/submission-evaluator.service";
import { JudgeService } from "../apps/api/src/modules/coding/services/judge.service";
import { OracleRegistry } from "../apps/api/src/modules/coding/oracles/oracle.registry";
import { MathPrimeCheckOracle } from "../apps/api/src/modules/coding/oracles/standard-oracles";
import { CodingExecutionService } from "../apps/api/src/modules/coding/services/coding-execution.service";
import { CodingEvaluatorService } from "../apps/api/src/modules/evaluation/objective/coding-evaluator.service";
import { AdminCodingSubmissionController } from "../apps/api/src/modules/coding/controllers/admin-coding-submission.controller";
import { SubmitCodeDto } from "../apps/api/src/modules/coding/dto/submit-code.dto";
import { AuthUser } from "../apps/api/src/modules/auth/interfaces/auth-user.interface";
import { UserRole } from "@prisma/client";

async function runPhase6E2EVerification() {
  console.log("=================================================");
  console.log("   PHASE 6: FULL REGRESSION & E2E VERIFICATION");
  console.log("=================================================\n");

  const mockUser: AuthUser = {
    id: "user-candidate-123",
    email: "candidate@intervu.ai",
    role: UserRole.CANDIDATE,
  };

  const judgeService = new JudgeService();
  const oracleRegistry = new OracleRegistry([new MathPrimeCheckOracle()]);
  const evaluatorService = new SubmissionEvaluatorService(judgeService, oracleRegistry);
  const codingExecutionService = new CodingExecutionService(
    null as any,
    judgeService,
    oracleRegistry,
    evaluatorService,
  );

  const primeQuestionData = {
    oracleKey: "MATH_PRIME_CHECK_ORACLE",
    publicTests: [{ input: { n: 7 }, expectedOutput: { result: true } }],
    hiddenTests: [{ input: { n: 13 }, expectedOutput: { result: true } }],
    boundaryTests: [{ input: { n: 2 }, expectedOutput: { result: true } }],
    stressTests: [{ input: { n: 1000003 }, expectedOutput: { result: true } }],
  };

  const correctCode = `def is_prime(n):\n    return n > 1 and all(n % i != 0 for i in range(2, int(n**0.5) + 1))\n`;

  const dto: SubmitCodeDto = {
    questionId: "q10",
    testInstanceId: "demo-sandbox-test-id",
    code: correctCode,
    language: "python",
  };

  // 1. CONCURRENT SUBMISSION LOCKING & DUPLICATE PROTECTION
  console.log("▶ 1. Testing Session Concurrency Locking & Duplicate Protection...");
  let secondCallFailedAsExpected = false;

  // Fire two rapid submissions concurrently
  const firstPromise = codingExecutionService.submitFullEvaluation(dto, mockUser);
  const secondPromise = codingExecutionService
    .submitFullEvaluation(dto, mockUser)
    .catch((err) => {
      secondCallFailedAsExpected = err.message.includes("already in progress");
    });

  await Promise.all([firstPromise, secondPromise]);

  if (!secondCallFailedAsExpected) {
    console.error("❌ FAIL: Concurrent lock did not block rapid duplicate execution!");
    process.exit(1);
  }
  console.log("   ✅ PASS: Concurrency lock successfully blocked duplicate submission request.\n");

  // 2. ASSESSMENT-LEVEL DETERMINISTIC SCORING INTEGRATION
  console.log("▶ 2. Testing Assessment-Level Deterministic Scoring Integration...");
  const mockLLMAdapter: any = { generate: async () => "" };
  const codingEvaluator = new CodingEvaluatorService(mockLLMAdapter);

  const candidateAnswerObj = {
    timeSpentSeconds: 45,
    textResponse: JSON.stringify({
      code: correctCode,
      language: "python",
      submissionId: "sub_123",
      score: 100,
      verdict: "ACCEPTED",
    }),
  };

  const evalResults = await codingEvaluator.evaluateAnswers(
    [
      {
        questionId: "q10",
        answer: candidateAnswerObj.textResponse,
        textResponse: candidateAnswerObj.textResponse,
        timeSpentSeconds: 45,
      } as any,
    ],
    [
      {
        id: "q10",
        questionType: "CODING",
        problemStatement: "Write a function to check if a number is prime.",
        questionText: "Primality Check",
      },
    ],
  );

  const res = evalResults[0];
  const feedbackText = res.codingFeedback || "";
  console.log("   Evaluated Score:    ", res.score);
  console.log("   Passed:             ", res.passed);
  console.log("   Feedback:           ", feedbackText);

  if (!res.passed || res.score !== 1.0 || !feedbackText.includes("all public, hidden")) {
    console.error("❌ FAIL: Deterministic score integration failed!");
    process.exit(1);
  }
  console.log("   ✅ PASS: Deterministic test-suite score integrated seamlessly into assessment evaluation.\n");

  // 3. ADMIN EVALUATION VISIBILITY
  console.log("▶ 3. Testing Admin Evaluation Visibility Endpoint...");
  const adminController = new AdminCodingSubmissionController(null as any);

  const adminView = await adminController.getCandidateCodingSubmissions("demo-sandbox-test-id");
  console.log("   Admin Audit Record:");
  console.log("     Candidate Name:  ", adminView.candidateName);
  console.log("     Submission ID:   ", adminView.submissions[0]?.questionId);
  console.log("     Verdict:         ", adminView.submissions[0]?.verdict);
  console.log("     Score:           ", adminView.submissions[0]?.score + "%");

  if (!adminView.submissions || adminView.submissions.length === 0 || adminView.submissions[0].verdict !== "ACCEPTED") {
    console.error("❌ FAIL: Admin evaluation visibility record check failed!");
    process.exit(1);
  }
  console.log("   ✅ PASS: Admin evaluation visibility endpoint returned full audit details.\n");

  console.log("=================================================");
  console.log("   ALL PHASE 6 E2E & REGRESSION TESTS PASSED!");
  console.log("=================================================");
}

runPhase6E2EVerification().catch((err) => {
  console.error("Fatal Phase 6 E2E Error:", err);
  process.exit(1);
});
