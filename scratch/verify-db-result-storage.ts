import { ResultStorageService } from "../apps/api/src/modules/evaluation/services/result-storage.service";
import { CandidateResultDto } from "@intervu-ai/contracts";

async function verifyDatabaseResultStorage() {
  console.log("=========================================================================");
  console.log("   VERIFYING DATABASE STORAGE FOR CANDIDATE_RESULTS & EVALUATION_RESULTS");
  console.log("=========================================================================\n");

  const candidateResultCalls: any[] = [];
  const evaluationResultCalls: any[] = [];

  const mockPrismaTx: any = {
    candidateResult: {
      upsert: async (opts: any) => {
        candidateResultCalls.push(opts);
        return opts.create;
      },
    },
    evaluationResult: {
      upsert: async (opts: any) => {
        evaluationResultCalls.push(opts);
        return opts.create;
      },
    },
    evaluationAnalytics: {
      upsert: async (opts: any) => opts.create,
    },
    submission: {
      updateMany: async (opts: any) => opts,
    },
    evaluationRun: {
      create: async (opts: any) => opts.data,
    },
  };

  const mockPrisma: any = {
    $transaction: async (cb: any) => cb(mockPrismaTx),
  };

  const storageService = new ResultStorageService(mockPrisma);

  const testResultPayload: CandidateResultDto = {
    id: "res_test_123",
    candidateId: "user_cand_99",
    attemptId: "attempt_demo_888",
    score: 2,
    percentage: 100,
    objectiveScore: 1,
    codingScore: 1,
    codingSolved: 1,
    passed: true,
    totalAttempted: 2,
    totalCorrect: 2,
    totalIncorrect: 0,
    maxMarks: 2,
    createdAt: new Date(),
    sections: [
      {
        sectionKey: "coding_sec",
        sectionName: "Coding Section",
        correct: 1,
        incorrect: 0,
        skipped: 0,
        marks: 1,
        accuracy: 100,
        totalQuestions: 1,
        attempted: 1,
        maxMarks: 1,
        percentage: 100,
      },
    ],
    analytics: {
      topicAccuracy: { Math: 100 },
      difficultyAccuracy: { MEDIUM: 100 },
      sectionAccuracy: { coding_sec: 100 },
      completionRate: 100,
      attemptRate: 100,
    },
    strengths: ["Math", "Coding"],
    weaknesses: [],
    recommendations: [
      {
        recommendationId: "rec_1",
        title: "Algorithm Optimization",
        description: "Maintain high proficiency in algorithm optimization.",
        skill: "Coding",
        priority: "HIGH",
      },
    ],
  };

  console.log("▶ 1. Triggering ResultStorageService.saveResult()...");
  await storageService.saveResult(testResultPayload, 150);

  console.log("   ✅ Transaction completed successfully.");

  // Verify CandidateResult upsert parameters
  const candResultCall = candidateResultCalls[0];
  console.log("\n▶ 2. Verifying candidate_results table upsert payload:");
  console.log("   candidateId:    ", candResultCall.create.candidateId);
  console.log("   attemptId:      ", candResultCall.create.attemptId);
  console.log("   score:          ", candResultCall.create.score);
  console.log("   percentage:     ", candResultCall.create.percentage + "%");
  console.log("   codingSolved:   ", candResultCall.create.codingSolved);

  if (
    candResultCall.create.candidateId !== "user_cand_99" ||
    candResultCall.create.score !== 2 ||
    candResultCall.create.percentage !== 100 ||
    candResultCall.create.codingSolved !== 1
  ) {
    console.error("❌ FAIL: candidate_results upsert payload mismatch!");
    process.exit(1);
  }
  console.log("   ✅ candidate_results table storage verified.\n");

  // Verify EvaluationResult upsert parameters
  const evalResultCall = evaluationResultCalls[0];
  console.log("▶ 3. Verifying evaluation_results table upsert payload:");
  console.log("   overallScore:       ", evalResultCall.create.overallScore);
  console.log("   technicalScore:     ", evalResultCall.create.technicalScore, "(Coding Score)");
  console.log("   communicationScore: ", evalResultCall.create.communicationScore, "(Objective Score)");
  console.log("   overallRating:      ", evalResultCall.create.overallRating, "(Passed Status)");

  if (
    evalResultCall.create.technicalScore !== 1 ||
    evalResultCall.create.communicationScore !== 1 ||
    evalResultCall.create.overallRating !== 1.0
  ) {
    console.error("❌ FAIL: evaluation_results table upsert payload mismatch!");
    process.exit(1);
  }
  console.log("   ✅ evaluation_results table storage verified.\n");

  console.log("=========================================================================");
  console.log("   CODING RESULT DB STORAGE & GENERATION VERIFIED SUCCESSFULLY!");
  console.log("=========================================================================");
}

verifyDatabaseResultStorage().catch((err) => {
  console.error("Fatal DB verification error:", err);
  process.exit(1);
});
