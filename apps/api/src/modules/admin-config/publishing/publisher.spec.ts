import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { ConfigPublisherService } from "./config-publisher.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConfigurationValidatorService } from "../validators/configuration-validator.service";
import { ConfigDependencyValidatorService } from "../validators/config-dependency-validator.service";
import { ConfigVersionService } from "../versioning/config-version.service";
import { FullExamConfig } from "../types";

const mockTransaction = {
  examConfig: { update: jest.fn() },
  configPublishLog: { create: jest.fn() },
};

const mockPrisma = {
  $transaction: jest.fn((callback) => callback(mockTransaction)),
  examConfig: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
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
      ],
    }).compile();

    service = module.get<ConfigPublisherService>(ConfigPublisherService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("publish", () => {
    it("should successfully publish a valid configuration", async () => {
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
