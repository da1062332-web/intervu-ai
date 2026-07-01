/**
 * Integration Test — Configuration Management System
 * Task Group 11 — Week 3 Day 1
 *
 * Covers the full lifecycle:
 *   DRAFT → Validate → Version → Publish
 *
 * Verifies:
 *  - Validation blocks invalid configs from being published
 *  - Dependency checks run as part of validation
 *  - Version is created and increments correctly
 *  - Status transitions: DRAFT → VALIDATED → PUBLISHED
 *  - Archived configs cannot be published
 *  - Restore resets status to DRAFT
 */

import { Test, TestingModule } from "@nestjs/testing";
import { ConfigurationValidatorService } from "../validators/configuration-validator.service";
import { ConfigDependencyValidatorService } from "../validators/config-dependency-validator.service";
import { ConfigVersionService } from "../versioning/config-version.service";
import { ConfigPublisherService } from "../publishing/config-publisher.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

const mockPrisma: any = {
  examConfig: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  examConfigVersion: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  configPublishLog: {
    create: jest.fn(),
  },
  difficultyDistribution: {
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  ruleFlags: {
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  examSection: {
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  template: {
    count: jest.fn().mockResolvedValue(5),
  },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeValidConfig = (overrides: Record<string, unknown> = {}) => ({
  id: "cfg-integration-1",
  name: "SDE Integration Exam",
  role: "Software Engineer",
  durationMinutes: 60,
  totalQuestions: 30,
  isArchived: false,
  status: "DRAFT",
  sections: [
    {
      id: "sec-1",
      name: "Data Structures",
      code: "DS",
      questionCount: 30,
      sectionDurationMinutes: 60,
      sectionOrder: 1,
      isRequired: true,
      sectionTopics: [
        {
          id: "st-1",
          topicId: "topic-1",
          topic: {
            id: "topic-1",
            name: "Arrays",
            status: "ACTIVE",
            concepts: [{ id: "c-1", code: "ARR", status: "ACTIVE" }],
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
  ruleFlags: null,
  ...overrides,
});

// ─── Setup ────────────────────────────────────────────────────────────────────

let module: TestingModule;
let validator: ConfigurationValidatorService;
let depValidator: ConfigDependencyValidatorService;
let versionService: ConfigVersionService;
let publisher: ConfigPublisherService;

beforeEach(async () => {
  jest.clearAllMocks();

  module = await Test.createTestingModule({
    providers: [
      ConfigurationValidatorService,
      ConfigDependencyValidatorService,
      ConfigVersionService,
      ConfigPublisherService,
      { provide: PrismaService, useValue: mockPrisma },
    ],
  }).compile();

  validator = module.get(ConfigurationValidatorService);
  depValidator = module.get(ConfigDependencyValidatorService);
  versionService = module.get(ConfigVersionService);
  publisher = module.get(ConfigPublisherService);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Configuration Lifecycle Integration — Draft → Validate → Version → Publish", () => {
  // ─── Step 1: Validation ────────────────────────────────────────────────────

  describe("Step 1 — Validation", () => {
    it("passes a fully valid configuration", async () => {
      const config = makeValidConfig() as any;
      const result = await validator.validate(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("fails when exam name is empty", async () => {
      const config = makeValidConfig({ name: "" }) as any;
      const result = await validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Exam name must not be empty");
    });

    it("fails when duration is 0", async () => {
      const config = makeValidConfig({ durationMinutes: 0 }) as any;
      const result = await validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes("duration"))).toBe(
        true,
      );
    });

    it("fails when totalQuestions is 0", async () => {
      const config = makeValidConfig({ totalQuestions: 0 }) as any;
      const result = await validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes("questions"))).toBe(
        true,
      );
    });

    it("fails when difficulty does not total 100%", async () => {
      const config = makeValidConfig({
        difficultyDistribution: {
          easyPercentage: 30,
          mediumPercentage: 30,
          hardPercentage: 30,
        },
      }) as any;
      const result = await validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes("100%"))).toBe(true);
    });

    it("fails when section has no topics", async () => {
      const config = makeValidConfig({
        sections: [
          {
            id: "sec-empty",
            name: "Empty Section",
            code: "ES",
            questionCount: 10,
            sectionDurationMinutes: 20,
            sectionTopics: [],
          },
        ],
      }) as any;
      const result = await validator.validate(config);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e: string) => e.includes("Empty Section")),
      ).toBe(true);
    });

    it("fails for ARCHIVED configs", async () => {
      const config = makeValidConfig({
        isArchived: true,
        status: "ARCHIVED",
      }) as any;
      const result = await validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes("Archived"))).toBe(
        true,
      );
    });
  });

  // ─── Step 2: Dependency Validation ────────────────────────────────────────

  describe("Step 2 — Dependency Validation", () => {
    it("passes dependencies for a valid config", async () => {
      const config = makeValidConfig() as any;
      const result = await depValidator.validateDependencies(config);
      expect(result.valid).toBe(true);
    });

    it("fails when section has no active topics", async () => {
      const config = makeValidConfig({
        sections: [
          {
            id: "sec-2",
            name: "Inactive Section",
            code: "IS",
            questionCount: 10,
            sectionDurationMinutes: 20,
            sectionTopics: [
              {
                topic: {
                  id: "t-1",
                  name: "Old Topic",
                  status: "INACTIVE",
                  concepts: [],
                },
              },
            ],
          },
        ],
      }) as any;
      const result = await depValidator.validateDependencies(config);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e: string) => e.includes("DEPENDENCY_FAIL")),
      ).toBe(true);
    });

    it("fails when totalQuestions is 0", async () => {
      const config = makeValidConfig({ totalQuestions: 0 }) as any;
      const result = await depValidator.validateDependencies(config);
      expect(result.valid).toBe(false);
    });

    it("warns when no templates exist for a topic's concepts", async () => {
      mockPrisma.template.count.mockResolvedValueOnce(0);
      const config = makeValidConfig() as any;
      const result = await depValidator.validateDependencies(config);
      expect(result.valid).toBe(true); // warnings don't block
      expect(
        result.warnings.some((w: string) => w.includes("DEPENDENCY_WARN")),
      ).toBe(true);
    });
  });

  // ─── Step 3: Version Creation ─────────────────────────────────────────────

  describe("Step 3 — Version Creation", () => {
    it("creates the first version (v1) for a fresh config", async () => {
      const config = makeValidConfig() as any;

      mockPrisma.examConfigVersion.findFirst.mockResolvedValue(null); // no prior version
      mockPrisma.examConfigVersion.create.mockResolvedValue({
        id: "ver-1",
        examConfigId: config.id,
        versionNumber: 1,
        snapshot: config,
        createdAt: new Date(),
      });

      const entry = await versionService.createVersion(config);
      expect(entry.versionNumber).toBe(1);
      expect(entry.configId).toBe(config.id);
    });

    it("auto-increments to v2 when v1 exists", async () => {
      const config = makeValidConfig() as any;

      mockPrisma.examConfigVersion.findFirst.mockResolvedValue({
        versionNumber: 1,
      });
      mockPrisma.examConfigVersion.create.mockResolvedValue({
        id: "ver-2",
        examConfigId: config.id,
        versionNumber: 2,
        snapshot: config,
        createdAt: new Date(),
      });

      const entry = await versionService.createVersion(config);
      expect(entry.versionNumber).toBe(2);
    });

    it("retrieves all versions in descending order", async () => {
      mockPrisma.examConfig.findUnique.mockResolvedValue({
        id: "cfg-integration-1",
      });
      mockPrisma.examConfigVersion.findMany.mockResolvedValue([
        {
          id: "v2",
          examConfigId: "cfg-integration-1",
          versionNumber: 2,
          snapshot: {},
          createdAt: new Date(),
        },
        {
          id: "v1",
          examConfigId: "cfg-integration-1",
          versionNumber: 1,
          snapshot: {},
          createdAt: new Date(),
        },
      ]);

      const versions = await versionService.getVersions("cfg-integration-1");
      expect(versions).toHaveLength(2);
      expect(versions[0].versionNumber).toBe(2);
    });
  });

  // ─── Step 4: Publishing ───────────────────────────────────────────────────

  describe("Step 4 — Publishing", () => {
    it("publishes a valid config and returns PUBLISHED status", async () => {
      const config = makeValidConfig() as any;
      mockPrisma.examConfig.findUnique.mockResolvedValue(config);
      mockPrisma.examConfigVersion.findFirst.mockResolvedValue(null);
      mockPrisma.examConfigVersion.create.mockResolvedValue({
        id: "ver-1",
        examConfigId: config.id,
        versionNumber: 1,
        snapshot: config,
        createdAt: new Date(),
      });
      mockPrisma.examConfig.update.mockResolvedValue({
        ...config,
        status: "PUBLISHED",
      });
      mockPrisma.configPublishLog.create.mockResolvedValue({});

      const result = await publisher.publish(config.id, "user-1");

      expect(result.status).toBe("PUBLISHED");
      expect(result.version).toBe("v1");
      expect(result.validation.valid).toBe(true);
    });

    it("blocks publishing an invalid config", async () => {
      const config = makeValidConfig({ totalQuestions: 0 }) as any;
      mockPrisma.examConfig.findUnique.mockResolvedValue(config);

      await expect(publisher.publish(config.id, "user-1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("blocks publishing an ARCHIVED config", async () => {
      const config = makeValidConfig({
        isArchived: true,
        status: "ARCHIVED",
      }) as any;
      mockPrisma.examConfig.findUnique.mockResolvedValue(config);

      await expect(publisher.publish(config.id, "user-1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws NotFoundException for non-existent config", async () => {
      mockPrisma.examConfig.findUnique.mockResolvedValue(null);
      await expect(
        publisher.publish("non-existent-id", "user-1"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Step 5: Restore ──────────────────────────────────────────────────────

  describe("Step 5 — Restore resets status to DRAFT", () => {
    it("restores a config to a previous version and resets status to DRAFT", async () => {
      const config = makeValidConfig({ status: "PUBLISHED" }) as any;
      const snapshot = makeValidConfig({ name: "Restored Exam" });

      mockPrisma.examConfig.findUnique.mockResolvedValue(config);
      mockPrisma.examConfigVersion.findUnique.mockResolvedValue({
        id: "ver-1",
        examConfigId: config.id,
        versionNumber: 1,
        snapshot,
        createdAt: new Date(),
      });

      mockPrisma.examSection.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.difficultyDistribution.deleteMany.mockResolvedValue({
        count: 0,
      });
      mockPrisma.ruleFlags.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.examConfig.update.mockResolvedValue({
        ...config,
        status: "DRAFT",
      });
      mockPrisma.difficultyDistribution.create.mockResolvedValue({});
      mockPrisma.examSection.create.mockResolvedValue({});

      const result = await versionService.restoreVersion(config.id, "ver-1");

      expect(result.message).toContain("DRAFT");
      expect(result.versionNumber).toBe(1);
      expect(mockPrisma.examConfig.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "DRAFT" }),
        }),
      );
    });

    it("blocks restore of ARCHIVED configs", async () => {
      const config = makeValidConfig({
        isArchived: true,
        status: "ARCHIVED",
      }) as any;
      mockPrisma.examConfig.findUnique.mockResolvedValue(config);

      await expect(
        versionService.restoreVersion(config.id, "ver-1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws NotFoundException for missing version", async () => {
      const config = makeValidConfig() as any;
      mockPrisma.examConfig.findUnique.mockResolvedValue(config);
      mockPrisma.examConfigVersion.findUnique.mockResolvedValue(null);

      await expect(
        versionService.restoreVersion(config.id, "non-existent-ver"),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
