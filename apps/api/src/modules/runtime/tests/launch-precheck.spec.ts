import { Test, TestingModule } from "@nestjs/testing";
import { LaunchPrecheckService } from "../services/launch-precheck.service";
import { PrismaService } from "../../../prisma/prisma.service";

describe("LaunchPrecheckService", () => {
  let service: LaunchPrecheckService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LaunchPrecheckService,
        {
          provide: PrismaService,
          useValue: {
            assembledTest: {
              findUnique: jest.fn(),
            },
            runtimeBuild: {
              findFirst: jest.fn(),
            },
            runtimeValidationLog: {
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<LaunchPrecheckService>(LaunchPrecheckService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should allow launch if all checks pass", async () => {
    (prisma.assembledTest.findUnique as jest.Mock).mockResolvedValue({
      status: "PUBLISHED",
    });
    (prisma.runtimeBuild.findFirst as jest.Mock).mockResolvedValue({
      status: "COMPLETED",
    });
    (prisma.runtimeValidationLog.findFirst as jest.Mock).mockResolvedValue({
      isValid: true,
    });

    const result = await service.precheck("test-1");
    expect(result.allowed).toBe(true);
    expect(result.reasons).toBeUndefined();
  });

  it("should deny launch if validation failed", async () => {
    (prisma.assembledTest.findUnique as jest.Mock).mockResolvedValue({
      status: "PUBLISHED",
    });
    (prisma.runtimeBuild.findFirst as jest.Mock).mockResolvedValue({
      status: "COMPLETED",
    });
    (prisma.runtimeValidationLog.findFirst as jest.Mock).mockResolvedValue({
      isValid: false,
    });

    const result = await service.precheck("test-2");
    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain("Runtime validation failed");
  });
});
