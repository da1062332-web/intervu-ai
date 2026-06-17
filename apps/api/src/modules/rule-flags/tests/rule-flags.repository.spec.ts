import { Test, TestingModule } from "@nestjs/testing";
import { RuleFlagsRepository } from "../repositories/rule-flags.repository";
import { PrismaService } from "../../../prisma/prisma.service";

describe("RuleFlagsRepository", () => {
  let repository: RuleFlagsRepository;
  let prisma: PrismaService;

  const mockPrisma = {
    examRuleFlags: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    examConfig: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleFlagsRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<RuleFlagsRepository>(RuleFlagsRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should find by config ID", async () => {
    const mockData = { id: "1" };
    mockPrisma.examRuleFlags.findUnique.mockResolvedValue(mockData);

    const result = await repository.findByConfigId("config-id");

    expect(prisma.examRuleFlags.findUnique).toHaveBeenCalledWith({
      where: { examConfigId: "config-id" },
    });
    expect(result).toEqual(mockData);
  });

  it("should upsert rule flags", async () => {
    const mockData = {
      negativeMarkingEnabled: true,
    } as unknown as import("@intervu/shared").UpdateRuleFlags;
    const mockResult = { id: "1", ...mockData };
    mockPrisma.examRuleFlags.upsert.mockResolvedValue(mockResult);

    const result = await repository.upsert("config-id", mockData);

    expect(prisma.examRuleFlags.upsert).toHaveBeenCalledWith({
      where: { examConfigId: "config-id" },
      update: mockData,
      create: { examConfigId: "config-id", ...mockData },
    });
    expect(result).toEqual(mockResult);
  });

  it("should return true if config exists", async () => {
    mockPrisma.examConfig.count.mockResolvedValue(1);
    const result = await repository.checkConfigExists("config-id");
    expect(result).toBe(true);
  });

  it("should return false if config does not exist", async () => {
    mockPrisma.examConfig.count.mockResolvedValue(0);
    const result = await repository.checkConfigExists("invalid-id");
    expect(result).toBe(false);
  });
});
