import { Test, TestingModule } from "@nestjs/testing";
import { ConfigurationValidatorService } from "./configuration-validator.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { FullExamConfig } from "../types";

const mockPrisma = {
  template: {
    count: jest.fn(),
  },
};

const makeConfig = (
  overrides: Partial<{
    name: string;
    durationMinutes: number;
    totalQuestions: number;
    isArchived: boolean;
    status: string;
    sections: unknown[];
    difficultyDistribution: unknown;
  }> = {},
) =>
  ({
    id: "config-1",
    name: "Test Config",
    role: "Engineer",
    durationMinutes: 60,
    totalQuestions: 30,
    isArchived: false,
    status: "DRAFT",
    sections: [
      {
        id: "sec-1",
        name: "Section A",
        questionCount: 30,
        sectionDurationMinutes: 60,
        sectionTopics: [
          {
            topicId: "topic-1",
            topic: { id: "topic-1", name: "Arrays", status: "ACTIVE" },
          },
        ],
      },
    ],
    difficultyDistribution: {
      easyPercentage: 30,
      mediumPercentage: 50,
      hardPercentage: 20,
    },
    ...overrides,
  }) as unknown as FullExamConfig;

describe("ConfigurationValidatorService", () => {
  let service: ConfigurationValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationValidatorService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ConfigurationValidatorService>(
      ConfigurationValidatorService,
    );
    jest.clearAllMocks();
    mockPrisma.template.count.mockResolvedValue(5);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validate - PASS cases", () => {
    it("should return valid:true for a fully configured exam", async () => {
      const result = await service.validate(makeConfig());
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("validate - FAIL cases", () => {
    it("should fail if config not found", async () => {
      const result = await service.validate(null);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/not found/i);
    });

    it("should fail if exam name is empty", async () => {
      const result = await service.validate(makeConfig({ name: "" }));
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/name must not be empty/i),
        ]),
      );
    });

    it("should fail if duration is 0", async () => {
      const result = await service.validate(makeConfig({ durationMinutes: 0 }));
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/duration must be greater/i),
        ]),
      );
    });

    it("should fail if totalQuestions is 0", async () => {
      const result = await service.validate(makeConfig({ totalQuestions: 0 }));
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/total questions must be/i),
        ]),
      );
    });

    it("should fail if config is archived", async () => {
      const result = await service.validate(
        makeConfig({ isArchived: true, status: "ARCHIVED" }),
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringMatching(/archived/i)]),
      );
    });

    it("should fail if no sections", async () => {
      const result = await service.validate(makeConfig({ sections: [] }));
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/at least one section/i),
        ]),
      );
    });

    it("should fail if section has no topics", async () => {
      const result = await service.validate(
        makeConfig({
          sections: [
            {
              id: "sec-1",
              name: "Empty Section",
              questionCount: 30,
              sectionDurationMinutes: 60,
              sectionTopics: [],
            },
          ],
        }),
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringMatching(/at least one topic/i)]),
      );
    });

    it("should fail if difficulty distribution does not total 100%", async () => {
      const result = await service.validate(
        makeConfig({
          difficultyDistribution: {
            easyPercentage: 30,
            mediumPercentage: 30,
            hardPercentage: 30,
          },
        }),
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringMatching(/total 100/i)]),
      );
    });

    it("should fail if no difficulty distribution set", async () => {
      const result = await service.validate(
        makeConfig({ difficultyDistribution: null }),
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/difficulty distribution/i),
        ]),
      );
    });
  });

  describe("validate - WARNING cases", () => {
    it("should warn if no templates exist in the system", async () => {
      mockPrisma.template.count.mockResolvedValue(0);
      const result = await service.validate(makeConfig());
      expect(result.valid).toBe(true);
      expect(result.warnings).toEqual(
        expect.arrayContaining([expect.stringMatching(/no active templates/i)]),
      );
    });
  });
});
