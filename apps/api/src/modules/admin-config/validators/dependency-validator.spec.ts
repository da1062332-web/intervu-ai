import { Test, TestingModule } from "@nestjs/testing";
import { ConfigDependencyValidatorService } from "./config-dependency-validator.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { FullExamConfig } from "../types";

const mockPrisma = {
  template: {
    count: jest.fn(),
  },
};

const makeConfig = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "config-1",
    name: "Test Config",
    totalQuestions: 30,
    sections: [
      {
        id: "sec-1",
        name: "Core Section",
        sectionTopics: [
          {
            sectionId: "sec-1",
            topicId: "t-1",
            topic: {
              id: "t-1",
              name: "Arrays",
              code: "arrays",
              status: "ACTIVE",
              concepts: [{ code: "array-manipulation" }],
            },
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

describe("ConfigDependencyValidatorService", () => {
  let service: ConfigDependencyValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigDependencyValidatorService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ConfigDependencyValidatorService>(
      ConfigDependencyValidatorService,
    );
    jest.clearAllMocks();
    mockPrisma.template.count.mockResolvedValue(5);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should pass when all dependencies are satisfied", async () => {
    const result = await service.validateDependencies(makeConfig());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail when config not found", async () => {
    const result = await service.validateDependencies(null);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/not found/i);
  });

  it("should fail when totalQuestions is 0", async () => {
    const result = await service.validateDependencies(
      makeConfig({ totalQuestions: 0 }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/question count is 0/i)]),
    );
  });

  it("should fail when section has no topics", async () => {
    const result = await service.validateDependencies(
      makeConfig({
        sections: [{ id: "sec-1", name: "Empty", sectionTopics: [] }],
      }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/no topics/i)]),
    );
  });

  it("should fail when all topics in a section are INACTIVE", async () => {
    const result = await service.validateDependencies(
      makeConfig({
        sections: [
          {
            id: "sec-1",
            name: "Section",
            sectionTopics: [
              {
                sectionId: "sec-1",
                topicId: "t-1",
                topic: {
                  id: "t-1",
                  name: "Old Topic",
                  code: "old",
                  status: "INACTIVE",
                },
              },
            ],
          },
        ],
      }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/none are ACTIVE/i)]),
    );
  });

  it("should fail when no sections defined", async () => {
    const result = await service.validateDependencies(
      makeConfig({ sections: [] }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/no sections/i)]),
    );
  });

  it("should warn when no templates exist for the topic concepts", async () => {
    mockPrisma.template.count.mockResolvedValue(0);
    const result = await service.validateDependencies(makeConfig());
    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringMatching(/no templates/i)]),
    );
  });
});
