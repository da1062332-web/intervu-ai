import { Test, TestingModule } from "@nestjs/testing";
import { CodingExecutionController } from "../coding-execution.controller";
import { CodingExecutionService } from "../../services/coding-execution.service";
import { JudgeService } from "../../services/judge.service";
import { PrismaService } from "../../../../prisma/prisma.service";
import { OracleRegistry } from "../../oracles/oracle.registry";
import { UserRole } from "@prisma/client";
import { NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { CodingContextResolverService } from "../../services/coding-context-resolver.service";
import { SubmissionEvaluatorService } from "../../services/submission-evaluator.service";


describe("CodingExecutionController & CodingExecutionService", () => {
  let controller: CodingExecutionController;
  let executionService: CodingExecutionService;
  let judgeService: jest.Mocked<JudgeService>;
  let prismaService: any;
  let contextResolver: any;

  const mockUser = {
    id: "user-candidate-1",
    email: "candidate@test.com",
    role: UserRole.CANDIDATE,
  };

  const mockQuestion = {
    id: "q-coding-1",
    questionTitle: "Array Rotation Challenge",
    codingData: {
      oracleKey: "ARRAY_ROTATION_ORACLE",
      publicTests: [
        {
          input: { arr: [1, 2, 3, 4, 5], k: 2 },
          expectedOutput: { result: [4, 5, 1, 2, 3] },
        },
      ],
      hiddenTests: [
        {
          input: { arr: [10, 20, 30], k: 1 },
          expectedOutput: { result: [30, 10, 20] },
        },
      ],
      stressTests: [
        {
          input: { arr: [1], k: 100 },
          expectedOutput: { result: [1] },
        },
      ],
      solutionCode: "def rotate(arr, k): return arr[-k:] + arr[:-k]",
    },
  };

  beforeEach(async () => {
    const mockJudgeService = {
      submitAndPoll: jest.fn(),
      mapLanguageToId: jest.fn().mockReturnValue(71),
      checkHealth: jest.fn().mockResolvedValue({ healthy: true }),
    };

    const mockPrismaService = {
      testInstance: {
        findUnique: jest.fn(),
      },
      question: {
        findUnique: jest.fn(),
      },
    };

    const mockOracleRegistry = {
      hasOracle: jest.fn().mockReturnValue(false),
      getOracle: jest.fn(),
    };

    const mockContextResolver = {
      resolveContext: jest.fn().mockImplementation((qId, tId, user) => {
        return Promise.resolve({
          question: mockQuestion,
          codingData: mockQuestion.codingData,
          questionText: mockQuestion.questionTitle,
          testInstanceQuestion: null
        });
      }),
    };

    const mockEvaluator = {
      evaluateSubmission: jest.fn(),
    };


    const module: TestingModule = await Test.createTestingModule({
      controllers: [CodingExecutionController],
      providers: [
        CodingExecutionService,
        { provide: JudgeService, useValue: mockJudgeService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OracleRegistry, useValue: mockOracleRegistry },
        { provide: CodingContextResolverService, useValue: mockContextResolver },
        { provide: SubmissionEvaluatorService, useValue: mockEvaluator },
      ],
    }).compile();

    controller = module.get<CodingExecutionController>(CodingExecutionController);
    executionService = module.get<CodingExecutionService>(CodingExecutionService);
    judgeService = module.get(JudgeService);
    prismaService = module.get(PrismaService);
    contextResolver = module.get(CodingContextResolverService);
  });

  describe("runCode", () => {
    it("should execute public tests only and return PASSED when candidate output matches expected output", async () => {
      prismaService.question.findUnique.mockResolvedValue(mockQuestion);

      judgeService.submitAndPoll.mockResolvedValue({
        token: "tok-1",
        statusId: 3,
        statusDescription: "Accepted",
        stdout: JSON.stringify([4, 5, 1, 2, 3]),
        stderr: "",
        compileOutput: "",
        message: "",
        time: 0.02,
        memory: 14000,
        error: null,
      });

      const response = await controller.runCode(
        {
          questionId: "q-coding-1",
          code: "print([4, 5, 1, 2, 3])",
          language: "python",
        },
        mockUser,
      );

      expect(response.success).toBe(true);
      expect(response.questionId).toBe("q-coding-1");
      expect(response.summary.total).toBe(1);
      expect(response.summary.passed).toBe(1);
      expect(response.summary.failed).toBe(0);

      expect(response.results).toHaveLength(1);
      expect(response.results[0].status).toBe("PASSED");
      expect(response.results[0].input).toEqual({ arr: [1, 2, 3, 4, 5], k: 2 });
      expect(response.results[0].actualOutput).toBe(JSON.stringify([4, 5, 1, 2, 3]));

      // Verify privacy boundary: hidden and stress tests must NEVER be in response
      const resKeys = Object.keys(response);
      expect(resKeys).not.toContain("hiddenTests");
      expect(resKeys).not.toContain("stressTests");
      expect(resKeys).not.toContain("solutionCode");
      expect((response as any).hiddenTests).toBeUndefined();
    });

    it("should return FAILED when actual output does not match expected output", async () => {
      prismaService.question.findUnique.mockResolvedValue(mockQuestion);

      judgeService.submitAndPoll.mockResolvedValue({
        token: "tok-2",
        statusId: 3,
        statusDescription: "Accepted",
        stdout: JSON.stringify([1, 2, 3, 4, 5]), // Wrong output
        stderr: "",
        compileOutput: "",
        message: "",
        time: 0.01,
        memory: 13000,
        error: null,
      });

      const response = await controller.runCode(
        {
          questionId: "q-coding-1",
          code: "print([1, 2, 3, 4, 5])",
          language: "python",
        },
        mockUser,
      );

      expect(response.summary.passed).toBe(0);
      expect(response.summary.failed).toBe(1);
      expect(response.results[0].status).toBe("FAILED");
    });

    it("should handle COMPILATION_ERROR status properly", async () => {
      prismaService.question.findUnique.mockResolvedValue(mockQuestion);

      judgeService.submitAndPoll.mockResolvedValue({
        token: "tok-3",
        statusId: 6,
        statusDescription: "Compilation Error",
        stdout: "",
        stderr: "",
        compileOutput: "SyntaxError: invalid syntax",
        message: "",
        time: null,
        memory: null,
        error: "SyntaxError: invalid syntax",
      });

      const response = await controller.runCode(
        {
          questionId: "q-coding-1",
          code: "def rotate(arr, k",
          language: "python",
        },
        mockUser,
      );

      expect(response.summary.failed).toBe(1);
      expect(response.results[0].status).toBe("COMPILATION_ERROR");
      expect(response.results[0].error).toBe("SyntaxError: invalid syntax");
    });

    it("should enforce session ownership when testInstanceId is provided", async () => {
      contextResolver.resolveContext.mockRejectedValueOnce(new ForbiddenException());

      await expect(
        controller.runCode(
          {
            questionId: "q-coding-1",
            testInstanceId: "sess-other-user",
            code: "print(1)",
            language: "python",
          },
          mockUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });


    it("should throw NotFoundException for demo/sandbox sessions if question does not exist", async () => {
      contextResolver.resolveContext.mockRejectedValueOnce(new NotFoundException());

      await expect(
        controller.runCode(
          {
            questionId: "q11-non-existent",
            testInstanceId: "demo-sandbox-test-id",
            code: "def rotate(arr, k): return arr[-k:] + arr[:-k]",
            language: "python",
          },
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
