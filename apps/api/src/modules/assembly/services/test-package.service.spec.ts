import { TestPackageService } from "./test-package.service";
import { NotFoundException } from "@nestjs/common";

const mockAssembledTestRepository = {
  findById: jest.fn(),
};

const mockBlueprintRepository = {
  getExamConfigForBlueprint: jest.fn(),
};

describe("TestPackageService", () => {
  let service: TestPackageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TestPackageService(
      mockAssembledTestRepository as unknown as import("../repositories/assembled-test.repository").AssembledTestRepository,
      mockBlueprintRepository as unknown as import("../repositories/blueprint.repository").BlueprintRepository,
    );
  });

  it("throws NotFoundException when assembly does not exist", async () => {
    mockAssembledTestRepository.findById.mockResolvedValue(null);
    await expect(service.generatePackage("nonexistent")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("generates package with correct metadata", async () => {
    const mockAssembly = {
      id: "asm-1",
      configId: "cfg-1",
      totalDurationSeconds: 3600,
      totalQuestions: 2,
      status: "DRAFT",
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
                questionText: "What is 2+2?",
                questionType: "MULTIPLE_CHOICE",
                difficultyLevel: "EASY",
                conceptKey: "math",
                options: ["2", "4", "6"],
                correctAnswer: "4",
                solution: "Simple addition",
              },
            },
            {
              questionId: "q2",
              questionOrder: 2,
              questionSnapshot: {
                questionText: "What is 3+3?",
                questionType: "MULTIPLE_CHOICE",
                difficultyLevel: "MEDIUM",
                conceptKey: "math",
                options: ["5", "6", "7"],
                correctAnswer: "6",
                solution: "Simple addition",
              },
            },
          ],
        },
      ],
    };

    mockAssembledTestRepository.findById.mockResolvedValue(mockAssembly);
    mockBlueprintRepository.getExamConfigForBlueprint.mockResolvedValue({
      id: "cfg-1",
      ruleFlags: { negativeMarkingEnabled: true, allowNavigation: false },
    });

    const pkg = await service.generatePackage("asm-1");

    expect(pkg.assemblyId).toBe("asm-1");
    expect(pkg.configId).toBe("cfg-1");
    expect(pkg.totalDurationSeconds).toBe(3600);
    expect(pkg.totalQuestions).toBe(2);
    expect(pkg.sections).toHaveLength(1);
    expect(pkg.sections[0].questions).toHaveLength(2);
    expect(pkg.sections[0].questions[0].questionText).toBe("What is 2+2?");
    expect(pkg.scoringRules.negativeMarkingEnabled).toBe(true);
    expect(pkg.scoringRules.allowNavigation).toBe(false);
    expect(pkg.packagedAt).toBeDefined();
  });

  it("uses default scoring rules when config not found", async () => {
    mockAssembledTestRepository.findById.mockResolvedValue({
      id: "asm-2",
      configId: "cfg-missing",
      totalDurationSeconds: 1800,
      totalQuestions: 0,
      status: "DRAFT",
      sections: [],
    });
    mockBlueprintRepository.getExamConfigForBlueprint.mockRejectedValue(
      new NotFoundException(),
    );

    const pkg = await service.generatePackage("asm-2");
    expect(pkg.scoringRules.negativeMarkingEnabled).toBe(false);
    expect(pkg.scoringRules.allowNavigation).toBe(true);
  });

  it("sorts sections by orderIndex", async () => {
    mockAssembledTestRepository.findById.mockResolvedValue({
      id: "asm-3",
      configId: "cfg-1",
      totalDurationSeconds: 3600,
      totalQuestions: 0,
      status: "DRAFT",
      sections: [
        {
          sectionKey: "B",
          sectionName: "B",
          durationSeconds: 900,
          questionCount: 0,
          orderIndex: 1,
          questions: [],
        },
        {
          sectionKey: "A",
          sectionName: "A",
          durationSeconds: 900,
          questionCount: 0,
          orderIndex: 0,
          questions: [],
        },
      ],
    });
    mockBlueprintRepository.getExamConfigForBlueprint.mockResolvedValue({
      id: "cfg-1",
      ruleFlags: {},
    });

    const pkg = await service.generatePackage("asm-3");
    expect(pkg.sections[0].sectionKey).toBe("A");
    expect(pkg.sections[1].sectionKey).toBe("B");
  });
});
