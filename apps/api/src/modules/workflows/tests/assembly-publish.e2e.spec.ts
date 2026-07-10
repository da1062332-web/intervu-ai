import { Test, TestingModule } from "@nestjs/testing";
import { AssemblyVersionService } from "../../assembly/services/assembly-version.service";
import { AssemblyVersionRepository } from "../../assembly/repositories/assembly-version.repository";
import { AssemblyPersistenceService } from "../../assembly/services/assembly-persistence.service";
import { AssemblyAuditService } from "../../assembly/services/assembly-audit.service";
import { AssembledTestRepository } from "../../assembly/repositories/assembled-test.repository";
import { AssessmentVersionValidatorService } from "../../assembly/services/assessment-version-validator.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { BadRequestException } from "@nestjs/common";

describe("Workflow E2E — Assembly Versioning & Rollback Safety Gates", () => {
  let versionService: AssemblyVersionService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      assemblyVersion: {
        findFirst: jest.fn().mockResolvedValue({ version: 3 }),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      assembledTest: {
        findUnique: jest.fn().mockResolvedValue({
          id: "asm-001",
          configId: "cfg-1",
          status: "PUBLISHED",
        }),
      },
      testInstance: {
        // Mock active attempts count
        count: jest.fn().mockResolvedValue(2),
      },
      $transaction: jest.fn((callback) => callback(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssemblyVersionService,
        AssemblyVersionRepository,
        AssembledTestRepository,
        AssessmentVersionValidatorService,
        {
          provide: AssemblyPersistenceService,
          useValue: {
            getAssembly: jest
              .fn()
              .mockResolvedValue({
                id: "asm-001",
                configId: "cfg-1",
                status: "PUBLISHED",
              }),
          },
        },
        {
          provide: AssemblyAuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    versionService = module.get<AssemblyVersionService>(AssemblyVersionService);

    // Mock findById of Repository
    jest
      .spyOn(
        module.get<AssemblyVersionRepository>(AssemblyVersionRepository),
        "findById",
      )
      .mockResolvedValue({
        id: "ver-1",
        assemblyId: "asm-001",
        version: 1,
        snapshot: {
          sections: [
            {
              sectionKey: "sec-01",
              displayName: "Coding",
              durationSeconds: 1000,
              questionCount: 1,
              orderIndex: 0,
              questions: [],
            },
          ],
          totalDurationSeconds: 1000,
          totalQuestions: 1,
        },
        createdAt: new Date(),
      } as any);

    // Mock replaceAssemblyWithTransaction
    jest
      .spyOn(
        module.get<AssembledTestRepository>(AssembledTestRepository),
        "replaceAssemblyWithTransaction",
      )
      .mockResolvedValue(undefined);
  });

  it("should fail rollback validation if the assembly is PUBLISHED and has active test instances running", async () => {
    // Attempt rollback to version 1
    const callRestore = versionService.restoreVersion(
      "asm-001",
      "ver-1",
      "admin-01",
    );

    await expect(callRestore).rejects.toThrow(BadRequestException);
    await expect(callRestore).rejects.toThrow(/active candidate sessions/);
  });

  it("should succeed with rollback validation if the assembly is DRAFT or has 0 active sessions", async () => {
    // 1. Mock count to return 0 active sessions
    prismaMock.testInstance.count.mockResolvedValue(0);

    const result = await versionService.restoreVersion(
      "asm-001",
      "ver-1",
      "admin-01",
    );

    // Success returns the assembly snapshot
    expect(result).toBeDefined();
  });
});
