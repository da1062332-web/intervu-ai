import { Test, TestingModule } from "@nestjs/testing";
import { CodingContextResolverService } from "../services/coding-context-resolver.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";

describe("CodingContextResolverService", () => {
  let resolver: CodingContextResolverService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodingContextResolverService,
        {
          provide: PrismaService,
          useValue: {
            testInstance: {
              findUnique: jest.fn(),
            },
            question: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    resolver = module.get<CodingContextResolverService>(CodingContextResolverService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should resolve valid test instance context successfully", async () => {
    const mockUser = { id: "user-1", role: UserRole.CANDIDATE } as any;
    const mockQuestionId = "q-prime";
    const mockTestInstanceId = "ti-1";
    
    const mockSnapshot = {
      id: "q-prime",
      questionType: "CODING",
      questionText: "Prime test",
      codingData: { oracleKey: "MATH_PRIME_CHECK_ORACLE" },
    };

    (prisma.testInstance.findUnique as jest.Mock).mockResolvedValue({
      id: "ti-1",
      userId: "user-1",
      questions: [
        {
          questionId: "q-prime",
          questionSnapshot: mockSnapshot,
        },
      ],
    });

    const result = await resolver.resolveContext(mockQuestionId, mockTestInstanceId, mockUser);
    
    expect(result.question).toEqual(mockSnapshot);
    expect(result.codingData).toEqual(mockSnapshot.codingData);
    expect(result.testInstanceQuestion).toBeDefined();
  });

  it("should fail if candidate does not own the test instance", async () => {
    const mockUser = { id: "hacker-1", role: UserRole.CANDIDATE } as any;
    
    (prisma.testInstance.findUnique as jest.Mock).mockResolvedValue({
      id: "ti-1",
      userId: "user-1", // owner is someone else
      questions: [],
    });

    await expect(
      resolver.resolveContext("q-prime", "ti-1", mockUser)
    ).rejects.toThrow(ForbiddenException);
  });

  it("should fail if test instance does not contain the requested question", async () => {
    const mockUser = { id: "user-1", role: UserRole.CANDIDATE } as any;
    
    (prisma.testInstance.findUnique as jest.Mock).mockResolvedValue({
      id: "ti-1",
      userId: "user-1",
      questions: [
        { questionId: "q-other" }
      ],
    });

    await expect(
      resolver.resolveContext("q-prime", "ti-1", mockUser)
    ).rejects.toThrow(BadRequestException);
  });

  it("should fail if resolved question is not CODING type", async () => {
    const mockUser = { id: "user-1", role: UserRole.CANDIDATE } as any;
    
    (prisma.testInstance.findUnique as jest.Mock).mockResolvedValue({
      id: "ti-1",
      userId: "user-1",
      questions: [
        {
          questionId: "q-mcq",
          questionSnapshot: {
            id: "q-mcq",
            questionType: "MCQ", // Not coding
            codingData: { dummy: "data" }
          },
        },
      ],
    });

    await expect(
      resolver.resolveContext("q-mcq", "ti-1", mockUser)
    ).rejects.toThrow(BadRequestException);
  });

  it("should fail if codingData is missing", async () => {
    const mockUser = { id: "user-1", role: UserRole.CANDIDATE } as any;
    
    (prisma.testInstance.findUnique as jest.Mock).mockResolvedValue({
      id: "ti-1",
      userId: "user-1",
      questions: [
        {
          questionId: "q-coding-missing-data",
          questionSnapshot: {
            id: "q-coding-missing-data",
            questionType: "CODING",
            // codingData is undefined
          },
        },
      ],
    });

    await expect(
      resolver.resolveContext("q-coding-missing-data", "ti-1", mockUser)
    ).rejects.toThrow(BadRequestException);
  });
});
