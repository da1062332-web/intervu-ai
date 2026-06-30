import { PublishReadinessService } from "./publish-readiness.service";
import { AssemblyStatus } from "@prisma/client";

const mockAssembledTestRepository = { findById: jest.fn() };
const mockVersionRepository = { getLatestVersionNumber: jest.fn() };
const mockPackageService = { generatePackage: jest.fn() };
const mockValidationV2 = { validate: jest.fn() };
const mockBlueprintBuilder = { generateBlueprint: jest.fn() };

const baseAssembly = {
  id: "asm-1",
  configId: "cfg-1",
  status: AssemblyStatus.DRAFT,
  totalQuestions: 2,
  sections: [
    {
      sectionKey: "SEC-A",
      sectionName: "Section A",
      durationSeconds: 1800,
      questionCount: 2,
      orderIndex: 0,
      questions: [
        {
          questionId: "q1",
          questionOrder: 1,
          questionSnapshot: {
            difficultyLevel: "EASY",
            conceptKey: "math",
            questionType: "MCQ",
          },
        },
        {
          questionId: "q2",
          questionOrder: 2,
          questionSnapshot: {
            difficultyLevel: "MEDIUM",
            conceptKey: "math",
            questionType: "MCQ",
          },
        },
      ],
    },
  ],
};

const baseBlueprint = {
  totalQuestions: 2,
  sections: [
    {
      sectionKey: "SEC-A",
      questionCount: 2,
      orderIndex: 0,
      topicAllocations: [],
      difficultyDistribution: { EASY: 50, MEDIUM: 50, HARD: 0 },
    },
  ],
};

describe("PublishReadinessService", () => {
  let service: PublishReadinessService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PublishReadinessService(
      mockAssembledTestRepository as unknown as import("../repositories/assembled-test.repository").AssembledTestRepository,
      mockVersionRepository as unknown as import("../repositories/assembly-version.repository").AssemblyVersionRepository,
      mockPackageService as unknown as import("./test-package.service").TestPackageService,
      mockValidationV2 as unknown as import("./assembly-validation-v2.service").AssemblyValidationV2Service,
      mockBlueprintBuilder as unknown as import("./blueprint-builder.service").BlueprintBuilderService,
    );
  });

  it("returns ready=true when all 6 checks pass", async () => {
    mockAssembledTestRepository.findById.mockResolvedValue(baseAssembly);
    mockBlueprintBuilder.generateBlueprint.mockResolvedValue(baseBlueprint);
    mockValidationV2.validate.mockReturnValue({
      valid: true,
      errors: [],
      coverage: 100,
      difficultyAccuracy: 100,
    });
    mockVersionRepository.getLatestVersionNumber.mockResolvedValue(1);
    mockPackageService.generatePackage.mockResolvedValue({
      sections: [{}],
      totalQuestions: 2,
    });

    const report = await service.check("asm-1");
    expect(report.ready).toBe(true);
    expect(report.checks.every((c) => c.passed)).toBe(true);
  });

  it("fails immediately if assembly not found", async () => {
    mockAssembledTestRepository.findById.mockResolvedValue(null);
    const report = await service.check("nonexistent");
    expect(report.ready).toBe(false);
    expect(report.checks[0].passed).toBe(false);
    expect(report.checks[0].name).toBe("Assembly Exists");
  });

  it("fails if assembly is already PUBLISHED", async () => {
    mockAssembledTestRepository.findById.mockResolvedValue({
      ...baseAssembly,
      status: AssemblyStatus.PUBLISHED,
    });
    mockBlueprintBuilder.generateBlueprint.mockResolvedValue(baseBlueprint);
    mockValidationV2.validate.mockReturnValue({
      valid: true,
      errors: [],
      coverage: 100,
      difficultyAccuracy: 100,
    });
    mockVersionRepository.getLatestVersionNumber.mockResolvedValue(1);
    mockPackageService.generatePackage.mockResolvedValue({
      sections: [{}],
      totalQuestions: 2,
    });

    const report = await service.check("asm-1");
    expect(report.ready).toBe(false);
    const statusCheck = report.checks.find((c) => c.name === "Assembly Status");
    expect(statusCheck?.passed).toBe(false);
  });

  it("fails if V2 validation has errors", async () => {
    mockAssembledTestRepository.findById.mockResolvedValue(baseAssembly);
    mockBlueprintBuilder.generateBlueprint.mockResolvedValue(baseBlueprint);
    mockValidationV2.validate.mockReturnValue({
      valid: false,
      errors: ["AVL-001: mismatch"],
      coverage: 50,
      difficultyAccuracy: 80,
    });
    mockVersionRepository.getLatestVersionNumber.mockResolvedValue(1);
    mockPackageService.generatePackage.mockResolvedValue({
      sections: [{}],
      totalQuestions: 2,
    });

    const report = await service.check("asm-1");
    expect(report.ready).toBe(false);
    const validationCheck = report.checks.find(
      (c) => c.name === "V2 Validation",
    );
    expect(validationCheck?.passed).toBe(false);
  });

  it("fails if no version snapshot exists", async () => {
    mockAssembledTestRepository.findById.mockResolvedValue(baseAssembly);
    mockBlueprintBuilder.generateBlueprint.mockResolvedValue(baseBlueprint);
    mockValidationV2.validate.mockReturnValue({
      valid: true,
      errors: [],
      coverage: 100,
      difficultyAccuracy: 100,
    });
    mockVersionRepository.getLatestVersionNumber.mockResolvedValue(0); // no version
    mockPackageService.generatePackage.mockResolvedValue({
      sections: [{}],
      totalQuestions: 2,
    });

    const report = await service.check("asm-1");
    expect(report.ready).toBe(false);
    const versionCheck = report.checks.find(
      (c) => c.name === "Version Snapshot Exists",
    );
    expect(versionCheck?.passed).toBe(false);
  });

  it("provides descriptive summary string", async () => {
    mockAssembledTestRepository.findById.mockResolvedValue(null);
    const report = await service.check("asm-1");
    expect(typeof report.summary).toBe("string");
    expect(report.summary.length).toBeGreaterThan(0);
  });
});
