import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { ConfigPublisherService } from "./config-publisher.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConfigurationValidatorService } from "../validators/configuration-validator.service";
import { ConfigDependencyValidatorService } from "../validators/config-dependency-validator.service";
import { ConfigVersionService } from "../versioning/config-version.service";
import { FullExamConfig } from "../types";
import { ExamConfigReadinessService } from "../services/exam-config-readiness.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { TestPoolManagerService } from "../../assembly/services/test-pool-manager.service";

const mockTransaction = {
  examConfig: { update: jest.fn() },
  configPublishLog: { create: jest.fn() },
  blueprint: { findUnique: jest.fn().mockResolvedValue({ id: "bp-1" }), create: jest.fn() },
  assembledTest: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
};

const mockPrisma = {
  $transaction: jest.fn((callback) => callback(mockTransaction)),
  examConfig: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  blueprint: { findUnique: jest.fn().mockResolvedValue({ id: "bp-1" }), create: jest.fn() },
  ruleFlags: {
    findUnique: jest.fn().mockResolvedValue({ poolEnabled: false }),
  },
};

const mockPoolManager = {
  rebuildPool: jest.fn().mockResolvedValue({ deleted: 2, added: 10, currentDepth: 10 }),
};

const mockValidator = {
  validate: jest.fn(),
};

const mockDepValidator = {
  validateDependencies: jest.fn(),
};

const mockVersionService = {
  createVersion: jest.fn(),
};

const mockReadinessService = {
  checkReadiness: jest.fn(),
};

const mockCacheService = {
  delete: jest.fn().mockResolvedValue(true),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
  invalidateBlueprint: jest.fn().mockResolvedValue(undefined),
};

const DRAFT_CONFIG = {
  id: "config-1",
  name: "Test Config",
  isArchived: false,
  status: "DRAFT",
} as unknown as FullExamConfig;

describe("ConfigPublisherService", () => {
  let service: ConfigPublisherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigPublisherService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigurationValidatorService, useValue: mockValidator },
        {
          provide: ConfigDependencyValidatorService,
          useValue: mockDepValidator,
        },
        { provide: ConfigVersionService, useValue: mockVersionService },
        { provide: ExamConfigReadinessService, useValue: mockReadinessService },
        { provide: RedisCacheService, useValue: mockCacheService },
        { provide: TestPoolManagerService, useValue: mockPoolManager },
      ],
    }).compile();

    service = module.get<ConfigPublisherService>(ConfigPublisherService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("publish", () => {
    it("should successfully publish a valid configuration with 100% readiness", async () => {
      mockPrisma.examConfig.findUnique.mockResolvedValue(DRAFT_CONFIG);
      mockValidator.validate.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      mockDepValidator.validateDependencies.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      mockReadinessService.checkReadiness.mockResolvedValue({
        score: 100,
        status: "READY",
        checks: [],
      });
      mockVersionService.createVersion.mockResolvedValue({
        id: "ver-1",
        versionNumber: 1,
      });
      mockTransaction.examConfig.update.mockResolvedValue({
        ...DRAFT_CONFIG,
        status: "PUBLISHED",
      });
      mockTransaction.configPublishLog.create.mockResolvedValue({});

      const result = await service.publish("config-1", "admin-1");

      expect(result.status).toBe("PUBLISHED");
      expect(result.version).toBe("v1");
      expect(mockTransaction.examConfig.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "PUBLISHED",
            isActive: true,
          }),
        }),
      );
      expect(mockTransaction.configPublishLog.create).toHaveBeenCalled();
    });

    it("should trigger pool rebuild when ruleFlags.poolEnabled is true", async () => {
      mockPrisma.examConfig.findUnique.mockResolvedValue(DRAFT_CONFIG);
      mockValidator.validate.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      mockDepValidator.validateDependencies.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      mockReadinessService.checkReadiness.mockResolvedValue({
        status: "READY",
        score: 100,
        checks: [],
      });
      mockVersionService.createVersion.mockResolvedValue({
        versionNumber: 1,
      });
      mockPrisma.ruleFlags.findUnique.mockResolvedValue({
        poolEnabled: true,
      });

      await service.publish("config-1", "admin-1");

      expect(mockPoolManager.rebuildPool).toHaveBeenCalledWith("config-1");
    });

    it("should not trigger pool rebuild when ruleFlags.poolEnabled is false", async () => {
      mockPrisma.examConfig.findUnique.mockResolvedValue(DRAFT_CONFIG);
      mockValidator.validate.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      mockDepValidator.validateDependencies.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      mockReadinessService.checkReadiness.mockResolvedValue({
        status: "READY",
        score: 100,
        checks: [],
      });
      mockVersionService.createVersion.mockResolvedValue({
        versionNumber: 1,
      });
      mockPrisma.ruleFlags.findUnique.mockResolvedValue({
        poolEnabled: false,
      });

      await service.publish("config-1", "admin-1");

      expect(mockPoolManager.rebuildPool).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException when readiness score is under 100%", async () => {
      mockPrisma.examConfig.findUnique.mockResolvedValue(DRAFT_CONFIG);
      mockValidator.validate.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      mockDepValidator.validateDependencies.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      mockReadinessService.checkReadiness.mockResolvedValue({
        score: 80,
        status: "WARNING",
        checks: [{ name: "Question Pool", status: "WARN", message: "Low capacity" }],
      });

      await expect(service.publish("config-1", "admin-1")).rejects.toThrow(
        BadRequestException,
      );
      expect(mockVersionService.createVersion).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException when config does not exist", async () => {
      mockPrisma.examConfig.findUnique.mockResolvedValue(null);
      await expect(service.publish("missing", "admin-1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException when config is archived", async () => {
      mockPrisma.examConfig.findUnique.mockResolvedValue({
        ...DRAFT_CONFIG,
        isArchived: true,
        status: "ARCHIVED",
      });
      await expect(service.publish("config-1", "admin-1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when validation fails", async () => {
      mockPrisma.examConfig.findUnique.mockResolvedValue(DRAFT_CONFIG);
      mockValidator.validate.mockResolvedValue({
        valid: false,
        errors: ["Difficulty distribution must total 100%"],
        warnings: [],
      });

      await expect(service.publish("config-1", "admin-1")).rejects.toThrow(
        BadRequestException,
      );
      expect(mockVersionService.createVersion).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException when dependency validation fails", async () => {
      mockPrisma.examConfig.findUnique.mockResolvedValue(DRAFT_CONFIG);
      mockValidator.validate.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      mockDepValidator.validateDependencies.mockResolvedValue({
        valid: false,
        errors: ["DEPENDENCY_FAIL: Section A has no topics"],
        warnings: [],
      });

      await expect(service.publish("config-1", "admin-1")).rejects.toThrow(
        BadRequestException,
      );
      expect(mockVersionService.createVersion).not.toHaveBeenCalled();
    });
  });

  describe("validateOnly", () => {
    it("should mark config as VALIDATED when both validators pass", async () => {
      mockPrisma.examConfig.findUnique.mockResolvedValue(DRAFT_CONFIG);
      mockValidator.validate.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      mockDepValidator.validateDependencies.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      mockPrisma.examConfig.update.mockResolvedValue({
        ...DRAFT_CONFIG,
        status: "VALIDATED",
      });

      const result = await service.validateOnly("config-1");
      expect(result.valid).toBe(true);
      expect(mockPrisma.examConfig.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "VALIDATED" }),
        }),
      );
    });

    it("should NOT update status when validation fails", async () => {
      mockPrisma.examConfig.findUnique.mockResolvedValue(DRAFT_CONFIG);
      mockValidator.validate.mockResolvedValue({
        valid: false,
        errors: ["Missing sections"],
        warnings: [],
      });
      mockDepValidator.validateDependencies.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      });

      const result = await service.validateOnly("config-1");
      expect(result.valid).toBe(false);
      expect(mockPrisma.examConfig.update).not.toHaveBeenCalled();
    });
  });
});
