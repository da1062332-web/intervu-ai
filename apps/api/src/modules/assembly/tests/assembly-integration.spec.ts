import { Test, TestingModule } from "@nestjs/testing";
import { IntelligentAllocationService } from "../services/intelligent-allocation.service";
import { AssemblyValidationV2Service } from "../services/assembly-validation-v2.service";
import { TestPackageService } from "../services/test-package.service";
import { PublishReadinessService } from "../services/publish-readiness.service";
import { QuestionBankSource } from "../services/question-bank-source";
import { DuplicateDetectionService } from "../services/duplicate-detection.service";
import { QuestionRotationService } from "../../question-bank/services/question-rotation.service";
import { QUESTION_SOURCE_TOKEN } from "../services/question-source.interface";
import { BlueprintBuilderService } from "../services/blueprint-builder.service";
import { AssembledTestRepository } from "../repositories/assembled-test.repository";
import { AssemblyVersionRepository } from "../repositories/assembly-version.repository";
import { BlueprintRepository } from "../repositories/blueprint.repository";
import { QuestionPoolRepository } from "../repositories/question-pool.repository";
import { AppLogger } from "@intervu-ai/shared-logger";
import { AssemblyStatus } from "@prisma/client";

// Mock Data

const MOCK_ASSEMBLY_ID = "asm-int-1";
const MOCK_CONFIG_ID = "cfg-int-1";

const mockRotationService = {
  checkAvailability: jest.fn(),
  retrieveAndReserve: jest.fn(),
};

const mockAssembledTestRepo = {
  findById: jest.fn(),
  updateStatus: jest.fn(),
};

const mockBlueprintRepo = {
  findById: jest.fn(),
};

const mockVersionRepo = {
  getLatestVersionNumber: jest.fn().mockResolvedValue(1),
};

const mockPoolRepo = {
  findMany: jest.fn(),
};

const mockBlueprintBuilder = {
  generateBlueprint: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

describe("Assembly Module Integration Layer - End to End", () => {
  let moduleRef: TestingModule;
  let allocationService: IntelligentAllocationService;
  let validationService: AssemblyValidationV2Service;
  let packageService: TestPackageService;
  let readinessService: PublishReadinessService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        IntelligentAllocationService,
        AssemblyValidationV2Service,
        TestPackageService,
        PublishReadinessService,
        DuplicateDetectionService,
        QuestionBankSource,
        { provide: QuestionRotationService, useValue: mockRotationService },
        { provide: QUESTION_SOURCE_TOKEN, useExisting: QuestionBankSource },
        { provide: AssembledTestRepository, useValue: mockAssembledTestRepo },
        { provide: BlueprintRepository, useValue: mockBlueprintRepo },
        { provide: AssemblyVersionRepository, useValue: mockVersionRepo },
        { provide: QuestionPoolRepository, useValue: mockPoolRepo },
        { provide: BlueprintBuilderService, useValue: mockBlueprintBuilder },
        { provide: AppLogger, useValue: mockLogger },
      ],
    }).compile();

    allocationService = moduleRef.get(IntelligentAllocationService);
    validationService = moduleRef.get(AssemblyValidationV2Service);
    packageService = moduleRef.get(TestPackageService);
    readinessService = moduleRef.get(PublishReadinessService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should execute the full assembly flow from allocation to publish readiness", async () => {
    // 1. Setup Mock Blueprint
    const sectionConfig = {
      sectionKey: "SEC-INT",
      displayName: "Integration Section",
      durationSeconds: 3600,
      questionCount: 3,
      orderIndex: 0,
      topicAllocations: [{ topicId: "topic-1", percentage: 100 }],
      difficultyDistribution: { EASY: 33, MEDIUM: 33, HARD: 34 },
    };

    mockBlueprintBuilder.generateBlueprint.mockResolvedValue({
      totalQuestions: 3,
      sections: [sectionConfig],
    });

    // 2. Mock Question Rotation Responses
    mockRotationService.checkAvailability.mockResolvedValue({
      status: "AVAILABLE",
      available: 1,
    });

    let order = 1;
    mockRotationService.retrieveAndReserve.mockImplementation(
      (req: {
        count?: number;
        difficultyDistribution: Record<string, number>;
        examId: string;
      }) => {
        const qs = [];
        const count = req.count || 1;
        for (let i = 0; i < count; i++) {
          const q = {
            id: `q-int-${order}`,
            assemblyId: "bank-asm-1",
            versionId: "v1",
            difficultyLevel:
              Object.keys(req.difficultyDistribution).find(
                (k) => req.difficultyDistribution[k] > 0,
              ) || "MEDIUM",
            questionType: "MULTIPLE_CHOICE",
            questionText: `Integration test question ${order}`,
            questionHash: `hash-${order}`,
            metadata: {},
          };
          qs.push(q);
          order++;
        }
        return Promise.resolve({
          assemblyId: req.examId,
          questions: qs,
        });
      },
    );

    // STEP 1: Allocate Section
    const allocationResult = await allocationService.allocateSection(
      sectionConfig,
      [],
    );

    expect(allocationResult.allocatedCount).toBe(3);
    expect(allocationResult.questions.length).toBe(3);
    expect(allocationResult.issues.length).toBe(0);

    // STEP 2: Validate Assembly (V2)
    const mockBlueprint = { totalQuestions: 3, sections: [sectionConfig] };
    const mappedSection = {
      sectionKey: sectionConfig.sectionKey,
      displayName: sectionConfig.displayName,
      durationSeconds: sectionConfig.durationSeconds,
      orderIndex: sectionConfig.orderIndex,
      questionCount: allocationResult.allocatedCount,
      questions: allocationResult.questions,
    };

    // Prepare mock assembly record for subsequent steps
    const mockAssemblyRecord = {
      id: MOCK_ASSEMBLY_ID,
      configId: MOCK_CONFIG_ID,
      status: AssemblyStatus.DRAFT,
      totalQuestions: 3,
      sections: [mappedSection],
    };

    mockAssembledTestRepo.findById.mockResolvedValue(mockAssemblyRecord);

    const validationReport = validationService.validate(
      mockBlueprint as unknown as import("@intervu/shared").BlueprintDto,
      [
        mappedSection as unknown as import("@intervu/shared").AllocatedSectionDto,
      ],
    );

    expect(validationReport.valid).toBe(true);
    expect(validationReport.coverage).toBe(100);
    expect(validationReport.difficultyAccuracy).toBeGreaterThan(95);
    expect(validationReport.errors.length).toBe(0);

    // STEP 3: Generate Execution Package
    const testPackage = await packageService.generatePackage(MOCK_ASSEMBLY_ID);

    expect(testPackage.assemblyId).toBe(MOCK_ASSEMBLY_ID);
    expect(testPackage.sections.length).toBe(1);
    expect(testPackage.sections[0].questions.length).toBe(3);
    expect(testPackage.totalQuestions).toBe(3);

    // STEP 4: Publish Readiness Gate
    const readinessReport = await readinessService.check(MOCK_ASSEMBLY_ID);

    expect(readinessReport.ready).toBe(true);
    expect(readinessReport.checks.length).toBe(6);
    expect(readinessReport.checks.every((c) => c.passed)).toBe(true);
  });

  it("should fail validation and block publish if duplicate detection flags questions", async () => {
    // Setup Mock Blueprint with 2 identical questions to force duplicate failure
    const sectionConfig = {
      sectionKey: "SEC-DUP",
      displayName: "Duplicate Section",
      durationSeconds: 3600,
      questionCount: 2,
      orderIndex: 0,
      topicAllocations: [{ topicId: "topic-1", percentage: 100 }],
      difficultyDistribution: { EASY: 2, MEDIUM: 0, HARD: 0 },
    };

    const duplicateQuestion = {
      questionId: "dup-q1",
      questionOrder: 1,
      questionSnapshot: {
        id: "dup-q1",
        difficultyLevel: "EASY",
        conceptKey: "topic-1",
        questionHash: "same-hash",
      },
    };

    const mockAllocatedSection = {
      sectionKey: "SEC-DUP",
      displayName: "Duplicate Section",
      allocatedCount: 2,
      questionCount: 2,
      orderIndex: 0,
      durationSeconds: 3600,
      questions: [
        duplicateQuestion,
        { ...duplicateQuestion, questionOrder: 2 }, // Exact same ID/Hash injected again
      ],
      issues: [],
    };

    mockAssembledTestRepo.findById.mockResolvedValue({
      id: MOCK_ASSEMBLY_ID,
      configId: MOCK_CONFIG_ID,
      status: AssemblyStatus.DRAFT,
      totalQuestions: 2,
      sections: [mockAllocatedSection],
    });

    mockBlueprintBuilder.generateBlueprint.mockResolvedValue({
      totalQuestions: 2,
      sections: [sectionConfig],
    });

    const mockBlueprintForValidation = {
      totalQuestions: 2,
      sections: [sectionConfig],
    };
    const validationReport = validationService.validate(
      mockBlueprintForValidation as unknown as import("@intervu/shared").BlueprintDto,
      [
        mockAllocatedSection as unknown as import("@intervu/shared").AllocatedSectionDto,
      ],
    );

    expect(validationReport.valid).toBe(false);
    expect(
      validationReport.errors.some(
        (e) => typeof e === "string" && e.includes("AVL-005"),
      ),
    ).toBe(true);

    const readinessReport = await readinessService.check(MOCK_ASSEMBLY_ID);
    expect(readinessReport.ready).toBe(false);
  });
});
