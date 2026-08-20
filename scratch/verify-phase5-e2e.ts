import { SubmissionEvaluatorService } from "../apps/api/src/modules/coding/services/submission-evaluator.service";
import { JudgeService } from "../apps/api/src/modules/coding/services/judge.service";
import { OracleRegistry } from "../apps/api/src/modules/coding/oracles/oracle.registry";
import { BasicGradeCalculatorOracle } from "../apps/api/src/modules/coding/oracles/basic-grade-calculator.oracle";
import { SubmitCodeDto } from "../apps/api/src/modules/coding/dto/submit-code.dto";

async function runPhase5Verification() {
  console.log("=================================================");
  console.log("   PHASE 5: REAL E2E SUBMISSION FLOW VERIFICATION");
  console.log("=================================================\n");

  const judgeService = new JudgeService();
  const oracleRegistry = new OracleRegistry([new BasicGradeCalculatorOracle()]);
  const evaluatorService = new SubmissionEvaluatorService(judgeService, oracleRegistry);

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

  // 1. TEST CORRECT SOLUTION
  console.log("▶ 1. Submitting CORRECT Python Solution for Prime Check...");
  const correctCode = `def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True
`;

  const correctDto: SubmitCodeDto = {
    questionId: "q10",
    testInstanceId: "demo-sandbox-test-id",
    code: correctCode,
    language: "python",
  };

  const correctResult = await evaluatorService.evaluateSubmission(
    correctDto,
    primeQuestionData,
    "Primality Test",
    true, // Demo mode fallback enabled
  );

  console.log("   Verdict:        ", correctResult.verdict);
  console.log("   Score:          ", correctResult.score + "%");
  console.log("   Total Tests:    ", correctResult.totalTests);
  console.log("   Passed Tests:   ", correctResult.passedTests);
  console.log("   Category Breakdown:");
  console.log("     Public:   ", correctResult.categories.public);
  console.log("     Hidden:   ", correctResult.categories.hidden);
  console.log("     Boundary: ", correctResult.categories.boundary);
  console.log("     Stress:   ", correctResult.categories.stress);

  if (correctResult.verdict !== "ACCEPTED" || correctResult.score !== 100) {
    console.error("❌ E2E FAIL: Correct solution did not produce ACCEPTED 100%");
    process.exit(1);
  }
  console.log("   ✅ PASS: Correct solution produced ACCEPTED 100%\n");

  // 2. TEST INCORRECT SOLUTION
  console.log("▶ 2. Submitting INCORRECT Python Solution (Always Returns True)...");
  const wrongCode = `def is_prime(n):
    return True
`;

  const wrongDto: SubmitCodeDto = {
    questionId: "q10",
    testInstanceId: "demo-sandbox-test-id",
    code: wrongCode,
    language: "python",
  };

  const wrongResult = await evaluatorService.evaluateSubmission(
    wrongDto,
    primeQuestionData,
    "Primality Test",
    false,
  );

  console.log("   Verdict:        ", wrongResult.verdict);
  console.log("   Score:          ", wrongResult.score + "%");
  console.log("   Passed Tests:   ", wrongResult.passedTests + " / " + wrongResult.totalTests);

  if (wrongResult.verdict !== "WRONG_ANSWER" || wrongResult.score >= 100) {
    console.error("❌ E2E FAIL: Incorrect solution did not produce WRONG_ANSWER");
    process.exit(1);
  }
  console.log("   ✅ PASS: Incorrect solution produced WRONG_ANSWER with score < 100%\n");

  // 3. TEST SECURITY PRIVACY ISOLATION
  console.log("▶ 3. Verifying Security & Privacy Isolation (Zero Private Test Leaks)...");
  const rawResponseJson = JSON.stringify(wrongResult);
  const leakedInputs = rawResponseJson.includes('"input":');
  const leakedOutputs = rawResponseJson.includes('"expectedOutput":');

  if (leakedInputs || leakedOutputs) {
    console.error("❌ SECURITY FAIL: Response leaked private inputs or expected outputs!");
    process.exit(1);
  }
  console.log("   ✅ PASS: Private inputs and expected outputs are 100% isolated server-side.\n");

  console.log("=================================================");
  console.log("   ALL PHASE 5 E2E VERIFICATION CHECKS PASSED!");
  console.log("=================================================");
}

runPhase5Verification().catch((err) => {
  console.error("Fatal E2E error:", err);
  process.exit(1);
});
