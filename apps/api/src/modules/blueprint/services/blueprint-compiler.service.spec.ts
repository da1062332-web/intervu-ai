import { Test, TestingModule } from "@nestjs/testing";
import { BlueprintCompilerService } from "./blueprint-compiler.service";
import { BlueprintService } from "./blueprint.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { BadRequestException } from "@nestjs/common";

describe("BlueprintCompilerService", () => {
  let service: BlueprintCompilerService;
  let blueprintServiceMock: {
    validate: jest.Mock;
  };
  let prismaServiceMock: {
    blueprint: { findUnique: jest.Mock };
    readinessReport: { findFirst: jest.Mock };
    concept: { findMany: jest.Mock };
    template: { findMany: jest.Mock };
    topic: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    blueprintServiceMock = {
      validate: jest.fn(),
    };

    prismaServiceMock = {
      blueprint: {
        findUnique: jest.fn(),
      },
      readinessReport: {
        findFirst: jest.fn(),
      },
      concept: {
        findMany: jest.fn(),
      },
      template: {
        findMany: jest.fn(),
      },
      topic: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlueprintCompilerService,
        { provide: BlueprintService, useValue: blueprintServiceMock },
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    service = module.get<BlueprintCompilerService>(BlueprintCompilerService);
  });

  describe("Allocation Engine (Largest Remainder Method)", () => {
    it("should allocate questions evenly when percentages align perfectly", () => {
      const items = [
        { id: "Arrays", percentage: 50 },
        { id: "Strings", percentage: 50 },
      ];
      const result = service.allocateQuestions(20, items);
      expect(result).toEqual({
        Arrays: 10,
        Strings: 10,
      });
    });

    it("should handle rounding discrepancies and distribute remainder deterministically", () => {
      const items = [
        { id: "A", percentage: 33.3 },
        { id: "B", percentage: 33.3 },
        { id: "C", percentage: 33.4 },
      ];
      // 10 questions.
      // A raw = 3.33 -> floor = 3, fraction = 0.33
      // B raw = 3.33 -> floor = 3, fraction = 0.33
      // C raw = 3.34 -> floor = 3, fraction = 0.34
      // Sum = 9. Remainder = 1.
      // C has largest fraction (0.34) so C gets 1.
      const result = service.allocateQuestions(10, items);
      expect(result).toEqual({
        A: 3,
        B: 3,
        C: 4,
      });
    });

    it("should break ties alphabetically on equal fractions", () => {
      const items = [
        { id: "Z", percentage: 33.3 },
        { id: "A", percentage: 33.3 },
        { id: "M", percentage: 33.4 },
      ];
      // 11 questions.
      // Z raw = 3.663 -> floor = 3, fraction = 0.663
      // A raw = 3.663 -> floor = 3, fraction = 0.663
      // M raw = 3.674 -> floor = 3, fraction = 0.674
      // Sum = 9. Remainder = 2.
      // First remainder question goes to M (fraction 0.674).
      // Next remainder question has tie between Z and A (both 0.663).
      // Alphabetically, A comes before Z, so A gets the question.
      // Total: M = 4, A = 4, Z = 3.
      const result = service.allocateQuestions(11, items);
      expect(result).toEqual({
        A: 4,
        M: 4,
        Z: 3,
      });
    });
  });

  describe("Difficulty Expansion Engine", () => {
    it("should expand difficulty levels correctly based on target ratios", () => {
      const dist = { easy: 20, medium: 50, hard: 30 };
      const result = service.expandDifficulty(10, dist);
      expect(result).toEqual({
        EASY: 2,
        MEDIUM: 5,
        HARD: 3,
      });
    });

    it("should distribute remainders using fixed priority HARD -> MEDIUM -> EASY", () => {
      const dist = { easy: 33.3, medium: 33.3, hard: 33.4 };
      // 10 questions.
      // EASY raw = 3.33 -> floor = 3, fraction = 0.33
      // MEDIUM raw = 3.33 -> floor = 3, fraction = 0.33
      // HARD raw = 3.34 -> floor = 3, fraction = 0.34
      // HARD gets the 1 remainder question because fraction is 0.34.
      let result = service.expandDifficulty(10, dist);
      expect(result).toEqual({
        EASY: 3,
        MEDIUM: 3,
        HARD: 4,
      });

      // 11 questions.
      // EASY raw = 3.663 -> floor = 3, fraction = 0.663
      // MEDIUM raw = 3.663 -> floor = 3, fraction = 0.663
      // HARD raw = 3.674 -> floor = 3, fraction = 0.674
      // Sum = 9. Remainder = 2.
      // First remainder goes to HARD (fraction 0.674).
      // Second remainder has a tie between MEDIUM and EASY (both 0.663).
      // Priority says MEDIUM is preferred over EASY, so MEDIUM gets it.
      // Total: HARD = 4, MEDIUM = 4, EASY = 3.
      result = service.expandDifficulty(11, dist);
      expect(result).toEqual({
        EASY: 3,
        MEDIUM: 4,
        HARD: 4,
      });
    });
  });

  describe("Compilation Validation", () => {
    const mockBlueprintId = "bp-123";

    it("should fail validation if readiness report status is not READY", async () => {
      blueprintServiceMock.validate.mockResolvedValue({
        valid: true,
        errors: [],
      });
      prismaServiceMock.blueprint.findUnique.mockResolvedValue({
        id: mockBlueprintId,
        configId: "config-123",
        sections: [],
      });
      prismaServiceMock.readinessReport.findFirst.mockResolvedValue({
        status: "NOT_READY",
      });

      const result = await service.validateCompilation(mockBlueprintId);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Readiness Not READY");
    });

    it("should fail validation if blueprint has no active concepts for an allocated topic", async () => {
      blueprintServiceMock.validate.mockResolvedValue({
        valid: true,
        errors: [],
      });
      prismaServiceMock.blueprint.findUnique.mockResolvedValue({
        id: mockBlueprintId,
        configId: "config-123",
        sections: [
          {
            sectionId: "sec-1",
            questionCount: 10,
            topicAllocations: [{ topicId: "arrays", percentage: 100 }],
            difficultyAllocation: { easy: 100, medium: 0, hard: 0 },
          },
        ],
      });
      prismaServiceMock.readinessReport.findFirst.mockResolvedValue({
        status: "READY",
      });
      // No active concepts found for 'arrays'
      prismaServiceMock.concept.findMany.mockResolvedValue([]);

      const result = await service.validateCompilation(mockBlueprintId);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("No Concepts Found for topic 'arrays'");
    });

    it("should fail validation if no templates are found for an allocated topic-difficulty", async () => {
      blueprintServiceMock.validate.mockResolvedValue({
        valid: true,
        errors: [],
      });
      prismaServiceMock.blueprint.findUnique.mockResolvedValue({
        id: mockBlueprintId,
        configId: "config-123",
        sections: [
          {
            sectionId: "sec-1",
            questionCount: 10,
            topicAllocations: [{ topicId: "arrays", percentage: 100 }],
            difficultyAllocation: { easy: 100, medium: 0, hard: 0 },
          },
        ],
      });
      prismaServiceMock.readinessReport.findFirst.mockResolvedValue({
        status: "READY",
      });
      prismaServiceMock.concept.findMany.mockResolvedValue([
        { id: "c1", code: "arrays_basic" },
      ]);
      // No active templates found for 'arrays_basic' at difficulty EASY
      prismaServiceMock.template.findMany.mockResolvedValue([]);

      const result = await service.validateCompilation(mockBlueprintId);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "No Templates Found for topic 'arrays' at difficulty level 'EASY'",
      );
    });

    it("should pass validation if everything is correctly configured and ready", async () => {
      blueprintServiceMock.validate.mockResolvedValue({
        valid: true,
        errors: [],
      });
      prismaServiceMock.blueprint.findUnique.mockResolvedValue({
        id: mockBlueprintId,
        configId: "config-123",
        sections: [
          {
            sectionId: "sec-1",
            questionCount: 10,
            topicAllocations: [{ topicId: "arrays", percentage: 100 }],
            difficultyAllocation: { easy: 100, medium: 0, hard: 0 },
          },
        ],
      });
      prismaServiceMock.readinessReport.findFirst.mockResolvedValue({
        status: "READY",
      });
      prismaServiceMock.concept.findMany.mockResolvedValue([
        { id: "c1", code: "arrays_basic" },
      ]);
      prismaServiceMock.template.findMany.mockResolvedValue([
        {
          id: "tpl-1",
          templateKey: "TPL_ARRAYS_1",
          conceptKey: "arrays_basic",
          questionType: "multiple_choice",
        },
      ]);

      const result = await service.validateCompilation(mockBlueprintId);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe("Compile Blueprint Execution", () => {
    const mockBlueprintId = "bp-123";

    it("should compile successfully and return a batch with requests", async () => {
      blueprintServiceMock.validate.mockResolvedValue({
        valid: true,
        errors: [],
      });
      prismaServiceMock.blueprint.findUnique.mockResolvedValue({
        id: mockBlueprintId,
        configId: "config-123",
        sections: [
          {
            sectionId: "sec-1",
            questionCount: 10,
            topicAllocations: [{ topicId: "arrays", percentage: 100 }],
            difficultyAllocation: { easy: 100, medium: 0, hard: 0 },
          },
        ],
      });
      prismaServiceMock.readinessReport.findFirst.mockResolvedValue({
        status: "READY",
      });
      prismaServiceMock.concept.findMany.mockResolvedValue([
        { id: "c1", code: "arrays_basic" },
      ]);
      prismaServiceMock.template.findMany.mockResolvedValue([
        {
          id: "tpl-1",
          templateKey: "TPL_ARRAYS_1",
          conceptKey: "arrays_basic",
          questionType: "multiple_choice",
        },
      ]);

      const result = await service.compileBlueprint(mockBlueprintId);
      expect(result.batchId).toBeDefined();
      expect(result.blueprintId).toBe(mockBlueprintId);
      expect(result.requests.length).toBe(1);
      expect(result.requests[0].quantity).toBe(10);
      expect(result.requests[0].difficulty).toBe("beginner");
      expect(result.requests[0].templateId).toBe("tpl-1");
    });

    it("should throw BadRequestException if validation fails", async () => {
      blueprintServiceMock.validate.mockResolvedValue({
        valid: true,
        errors: [],
      });
      prismaServiceMock.blueprint.findUnique.mockResolvedValue({
        id: mockBlueprintId,
        configId: "config-123",
        sections: [],
      });
      prismaServiceMock.readinessReport.findFirst.mockResolvedValue({
        status: "NOT_READY",
      });

      await expect(service.compileBlueprint(mockBlueprintId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
