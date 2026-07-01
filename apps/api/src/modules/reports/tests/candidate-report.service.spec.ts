import { Test, TestingModule } from "@nestjs/testing";
import { CandidateReportService } from "../services/candidate-report.service";
import { PrismaService } from "@/prisma/prisma.service";
import { ResultsService } from "../../results/services/results.service";
import { ReportAuditService } from "../services/report-audit.service";
import { NotFoundException } from "@nestjs/common";

describe("CandidateReportService", () => {
  let service: CandidateReportService;
  let prisma: PrismaService;
  let resultsService: ResultsService;
  let auditService: ReportAuditService;

  const mockPrisma = {
    testInstance: {
      findUnique: jest.fn(),
    },
    evaluationResult: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockResultsService = {
    getResultDetails: jest.fn(),
  };

  const mockAuditService = {
    logReportViewed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateReportService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ResultsService, useValue: mockResultsService },
        { provide: ReportAuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<CandidateReportService>(CandidateReportService);
    prisma = module.get<PrismaService>(PrismaService);
    resultsService = module.get<ResultsService>(ResultsService);
    auditService = module.get<ReportAuditService>(ReportAuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should throw NotFoundException if attempt is missing", async () => {
    mockPrisma.testInstance.findUnique.mockResolvedValue(null);

    await expect(
      service.getCandidateReport("user-1", "attempt-1"),
    ).rejects.toThrow(NotFoundException);
  });

  it("should throw NotFoundException if evaluation is not completed", async () => {
    mockPrisma.testInstance.findUnique.mockResolvedValue({
      id: "attempt-1",
      userId: "user-1",
    });
    mockPrisma.evaluationResult.findUnique.mockResolvedValue(null);

    await expect(
      service.getCandidateReport("user-1", "attempt-1"),
    ).rejects.toThrow(NotFoundException);
  });

  it("should generate report correctly with rank and percentile", async () => {
    const attempt = {
      id: "attempt-1",
      userId: "user-1",
      testConfigId: "config-1",
      user: { fullName: "Test User", email: "test@intervu.ai" },
      testConfig: { displayName: "JS Test", totalDurationSeconds: 1800 },
    };

    const evaluation = {
      id: "eval-1",
      overallScore: 85,
      accuracy: 90,
      totalQuestions: 10,
      correctAnswers: 9,
      skillScores: [{ skill: "JS Basics", score: 90, feedback: "Great" }],
      recommendations: [
        {
          id: "rec-1",
          skill: "JS Basics",
          priority: "HIGH",
          title: "Improve",
          description: "Read docs",
        },
      ],
    };

    mockPrisma.testInstance.findUnique.mockResolvedValue(attempt);
    mockPrisma.evaluationResult.findUnique.mockResolvedValue(evaluation);
    mockPrisma.evaluationResult.findMany.mockResolvedValue([
      { overallScore: 90 },
      { overallScore: 85 },
      { overallScore: 70 },
    ]);

    mockResultsService.getResultDetails.mockResolvedValue({
      accuracy: 90,
      timeAnalysis: { totalTimeSpentSeconds: 600 },
      sectionScores: [],
      topicScores: [],
      difficultyScores: [],
    });

    const report = await service.getCandidateReport("user-1", "attempt-1");

    expect(report.candidate.fullName).toBe("Test User");
    expect(report.score).toBe(85);
    expect(report.rank).toBe(2);
    expect(report.percentile).toBe(50); // 2nd of 3 attempts: ((3 - 2) / (3 - 1)) * 100 = 50%
    expect(report.strengths).toContain("JS Basics");
    expect(mockAuditService.logReportViewed).toHaveBeenCalledWith("attempt-1");
  });
});
