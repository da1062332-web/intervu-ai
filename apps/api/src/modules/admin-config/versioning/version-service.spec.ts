import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { ConfigVersionService } from "./config-version.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { FullExamConfig } from "../types";

const mockTransaction = {
  examConfig: { update: jest.fn() },
  examSection: { deleteMany: jest.fn(), create: jest.fn() },
  difficultyDistribution: { deleteMany: jest.fn(), create: jest.fn() },
  ruleFlags: { deleteMany: jest.fn(), create: jest.fn() },
};

const mockPrisma = {
  $transaction: jest.fn((callback) => callback(mockTransaction)),
  examConfig: {
    findUnique: jest.fn(),
  },
  examConfigVersion: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

const MOCK_CONFIG = {
  id: "config-1",
  name: "My Config",
  role: "Engineer",
  description: null,
  durationMinutes: 60,
  totalQuestions: 30,
  isArchived: false,
  status: "DRAFT",
} as unknown as FullExamConfig;

describe("ConfigVersionService", () => {
  let service: ConfigVersionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigVersionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ConfigVersionService>(ConfigVersionService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createVersion", () => {
    it("should create version 1 when no prior versions exist", async () => {
      mockPrisma.examConfigVersion.findFirst.mockResolvedValue(null);
      mockPrisma.examConfigVersion.create.mockResolvedValue({
        id: "v-1",
        examConfigId: "config-1",
        versionNumber: 1,
        snapshot: {},
        createdAt: new Date(),
      });

      const result = await service.createVersion(MOCK_CONFIG);
      expect(result.versionNumber).toBe(1);
      expect(mockPrisma.examConfigVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ versionNumber: 1 }),
        }),
      );
    });

    it("should increment version number when prior versions exist", async () => {
      mockPrisma.examConfigVersion.findFirst.mockResolvedValue({
        id: "v-3",
        examConfigId: "config-1",
        versionNumber: 3,
        snapshot: {},
        createdAt: new Date(),
      });
      mockPrisma.examConfigVersion.create.mockResolvedValue({
        id: "v-4",
        examConfigId: "config-1",
        versionNumber: 4,
        snapshot: {},
        createdAt: new Date(),
      });

      const result = await service.createVersion(MOCK_CONFIG);
      expect(result.versionNumber).toBe(4);
    });
  });

  describe("getVersions", () => {
    it("should return versions in descending order", async () => {
      mockPrisma.examConfig.findUnique.mockResolvedValue(MOCK_CONFIG);
      mockPrisma.examConfigVersion.findMany.mockResolvedValue([
        {
          id: "v-2",
          examConfigId: "config-1",
          versionNumber: 2,
          snapshot: {},
          createdAt: new Date(),
        },
        {
          id: "v-1",
          examConfigId: "config-1",
          versionNumber: 1,
          snapshot: {},
          createdAt: new Date(),
        },
      ]);

      const result = await service.getVersions("config-1");
      expect(result).toHaveLength(2);
      expect(result[0].versionNumber).toBe(2);
    });

    it("should throw NotFoundException when config does not exist", async () => {
      mockPrisma.examConfig.findUnique.mockResolvedValue(null);
      await expect(service.getVersions("missing-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("restoreVersion", () => {
    it("should restore config fields from snapshot and reset to DRAFT", async () => {
      const snapshotData = {
        name: "Old Name",
        role: "Old Role",
        durationMinutes: 45,
        totalQuestions: 25,
        description: null,
      };

      mockPrisma.examConfig.findUnique.mockResolvedValue(MOCK_CONFIG);
      mockPrisma.examConfigVersion.findUnique.mockResolvedValue({
        id: "v-1",
        examConfigId: "config-1",
        versionNumber: 1,
        snapshot: snapshotData,
        createdAt: new Date(),
      });
      mockTransaction.examConfig.update.mockResolvedValue({});

      const result = await service.restoreVersion("config-1", "v-1");
      expect(result.versionNumber).toBe(1);
      expect(mockTransaction.examConfig.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "DRAFT" }),
        }),
      );
    });

    it("should throw NotFoundException when config does not exist", async () => {
      mockPrisma.examConfig.findUnique.mockResolvedValue(null);
      await expect(service.restoreVersion("missing", "v-1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException when config is archived", async () => {
      mockPrisma.examConfig.findUnique.mockResolvedValue({
        ...MOCK_CONFIG,
        isArchived: true,
        status: "ARCHIVED",
      });
      await expect(service.restoreVersion("config-1", "v-1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw NotFoundException when version does not belong to config", async () => {
      mockPrisma.examConfig.findUnique.mockResolvedValue(MOCK_CONFIG);
      mockPrisma.examConfigVersion.findUnique.mockResolvedValue({
        id: "v-1",
        examConfigId: "other-config",
        versionNumber: 1,
        snapshot: {},
        createdAt: new Date(),
      });
      await expect(service.restoreVersion("config-1", "v-1")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
