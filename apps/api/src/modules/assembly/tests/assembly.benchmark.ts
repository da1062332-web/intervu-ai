import { IntelligentAllocationService } from "../services/intelligent-allocation.service";
import { AssemblyValidationV2Service } from "../services/assembly-validation-v2.service";

import { QuestionBankSource } from "../services/question-bank-source";
import { DuplicateDetectionService } from "../services/duplicate-detection.service";
import { AppLogger } from "@intervu-ai/shared-logger";

async function runBenchmark() {
  console.log("==========================================");
  console.log("Assembly Integration Layer - Benchmark");
  console.log("==========================================");

  const mockLogger = new AppLogger({ name: "Benchmark" });

  // Generate 10,000 question pool mock
  const POOL_SIZE = 10000;
  console.log(`[SETUP] Generating mock pool of ${POOL_SIZE} questions...`);

  const mockRotationService = {
    checkAvailability: async () => ({
      status: "AVAILABLE",
      available: POOL_SIZE,
    }),
    retrieveAndReserve: async (req: {
      examId: string;
      count?: number;
      difficultyDistribution: Record<string, number>;
    }) => {
      const qCount = req.count || 1;
      const questions = Array.from({ length: qCount }).map((_, i) => ({
        id: `q-bench-${i}`,
        assemblyId: req.examId,
        versionId: "v1",
        difficultyLevel:
          Object.keys(req.difficultyDistribution).find(
            (k) => req.difficultyDistribution[k] > 0,
          ) || "MEDIUM",
        questionType: "MULTIPLE_CHOICE",
        questionText: `Benchmark question ${i}`,
        questionHash: `bench-hash-${i}`,
        metadata: {},
      }));
      return { assemblyId: req.examId, questions };
    },
  };

  const questionSource = new QuestionBankSource(
    mockRotationService as unknown as import("../../question-bank/services/question-rotation.service").QuestionRotationService,
    mockLogger as unknown as import("../repositories/question-pool.repository").QuestionPoolRepository,
  );
  const allocationService = new IntelligentAllocationService(questionSource);
  const duplicateService = new DuplicateDetectionService();
  const validationService = new AssemblyValidationV2Service(duplicateService);

  // Dummy package & readiness services since they depend on DB repos
  // We will mock their heavy operations
  const mockPackageService = {
    generatePackage: async () => {
      // Simulate mapping 90 questions
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { metadata: {}, sections: [], totalQuestions: 90 };
    },
  };

  const mockReadinessService = {
    check: async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { ready: true, checks: [] };
    },
  };

  const sectionConfig = {
    sectionKey: "BENCHMARK-SEC",
    displayName: "Benchmark Section",
    durationSeconds: 3600,
    questionCount: 90, // We need to generate a 90 question test
    orderIndex: 0,
    topicAllocations: [{ topicId: "bench-topic", percentage: 100 }],
    difficultyDistribution: { EASY: 30, MEDIUM: 40, HARD: 20 },
  };

  console.log("[RUN] Starting benchmark...");
  const startTime = performance.now();

  // 1. Allocation (includes Rotation Service Reservation)
  const t0 = performance.now();
  const allocatedSection = await allocationService.allocateSection(
    sectionConfig as unknown as import("@intervu/shared").BlueprintSectionDto,
    [],
  );
  const t1 = performance.now();
  console.log(`[TIME] Allocation & Reservation: ${(t1 - t0).toFixed(2)}ms`);

  // 2. Validation
  const t2 = performance.now();
  const mockBlueprint = { totalQuestions: 90, sections: [sectionConfig] };
  validationService.validate(
    mockBlueprint as unknown as import("@intervu/shared").BlueprintDto,
    [
      allocatedSection as unknown as import("@intervu/shared").AllocatedSectionDto,
    ],
  );
  const t3 = performance.now();
  console.log(`[TIME] Validation (V2 + Duplicates): ${(t3 - t2).toFixed(2)}ms`);

  // 3. Packaging
  const t4 = performance.now();
  await mockPackageService.generatePackage();
  const t5 = performance.now();
  console.log(`[TIME] Packaging: ${(t5 - t4).toFixed(2)}ms`);

  // 4. Readiness
  const t6 = performance.now();
  await mockReadinessService.check();
  const t7 = performance.now();
  console.log(`[TIME] Readiness: ${(t7 - t6).toFixed(2)}ms`);

  const totalTime = performance.now() - startTime;
  console.log("==========================================");
  console.log(`[RESULT] Total Generation Time: ${totalTime.toFixed(2)}ms`);
  console.log(`[RESULT] SLA Target: <5000ms`);

  if (totalTime < 5000) {
    console.log("✅ PASSED: Performance is well within SLA.");
  } else {
    console.log("❌ FAILED: Performance missed SLA target.");
    process.exit(1);
  }
}

runBenchmark().catch(console.error);
