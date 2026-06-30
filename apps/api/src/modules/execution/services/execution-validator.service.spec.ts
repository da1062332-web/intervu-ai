import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionValidatorService } from "./execution-validator.service";
import { TestInstanceRepository } from "../repositories";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { TestInstance } from "@prisma/client";

describe("ExecutionValidatorService", () => {
  let service: ExecutionValidatorService;
  let repo: jest.Mocked<TestInstanceRepository>;

  beforeEach(async () => {
    const repoMock = {
      findById: jest.fn(),
      withTransaction: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionValidatorService,
        {
          provide: TestInstanceRepository,
          useValue: repoMock,
        },
        {
          provide: PrismaService,
          useValue: {
            testConfig: { findUnique: jest.fn() },
            examConfig: { findUnique: jest.fn() },
            executionState: { findUnique: jest.fn() },
            testInstance: { findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<ExecutionValidatorService>(ExecutionValidatorService);
    repo = module.get(TestInstanceRepository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validateAssessment", () => {
    it("should throw NotFound if assessment is missing", async () => {
      repo.findById.mockResolvedValueOnce(null);
      await expect(service.validateAssessment("test_1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should return assessment if exists", async () => {
      repo.findById.mockResolvedValueOnce({
        id: "test_1",
      } as unknown as TestInstance);
      const res = await service.validateAssessment("test_1");
      expect(res.id).toBe("test_1");
    });
  });

  describe("validateOwnership", () => {
    it("should throw Forbidden if user is different", () => {
      expect(() =>
        service.validateOwnership(
          { userId: "user_1" } as unknown as TestInstance,
          "user_2",
        ),
      ).toThrow(ForbiddenException);
    });

    it("should not throw if user matches", () => {
      expect(() =>
        service.validateOwnership(
          { userId: "user_1" } as unknown as TestInstance,
          "user_1",
        ),
      ).not.toThrow();
    });
  });

  describe("validateSubmissionState", () => {
    it("should throw Conflict if already submitted", () => {
      expect(() =>
        service.validateSubmissionState({
          status: "SUBMITTED",
        } as unknown as TestInstance),
      ).toThrow(ConflictException);
    });

    it("should not throw if active", () => {
      expect(() =>
        service.validateSubmissionState({
          status: "ACTIVE",
        } as unknown as TestInstance),
      ).not.toThrow();
    });
  });
});
