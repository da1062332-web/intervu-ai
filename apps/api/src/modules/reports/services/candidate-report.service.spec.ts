import { Test, TestingModule } from '@nestjs/testing';
import { CandidateReportService } from './candidate-report.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ResultsService } from '../../results/services/results.service';
import { ReportAuditService } from './report-audit.service';
import { NotFoundException } from '@nestjs/common';

describe('CandidateReportService', () => {
  let service: CandidateReportService;
  let prisma: any;
  let resultsService: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      testInstance: { findUnique: jest.fn() },
      evaluationResult: { findUnique: jest.fn(), findMany: jest.fn() },
    };
    resultsService = {
      getResultDetails: jest.fn().mockResolvedValue({
        accuracy: 80,
        timeAnalysis: { totalTimeSpentSeconds: 100 },
        sectionScores: [],
        topicScores: [],
        difficultyScores: [],
      }),
    };
    auditService = {
      logReportViewed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateReportService,
        { provide: PrismaService, useValue: prisma },
        { provide: ResultsService, useValue: resultsService },
        { provide: ReportAuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<CandidateReportService>(CandidateReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException if attempt is missing', async () => {
    prisma.testInstance.findUnique.mockResolvedValue(null);
    await expect(service.getCandidateReport('user-1', 'attempt-1')).rejects.toThrow(NotFoundException);
  });

  it('should return mapped candidate report', async () => {
    prisma.testInstance.findUnique.mockResolvedValue({
      id: 'attempt-1',
      userId: 'user-1',
      testConfigId: 'config-1',
      user: { fullName: 'Test User', email: 'test@example.com' },
      testConfig: { displayName: 'Test Config', totalDurationSeconds: 3600 },
    });
    prisma.evaluationResult.findUnique.mockResolvedValue({
      overallScore: 85,
      skillScores: [
        { skill: 'React', score: 90 },
        { skill: 'Node', score: 50 },
      ],
      recommendations: [{ id: 'rec-1', title: 'Study Node', description: 'Review docs', priority: 'HIGH' }],
    });
    prisma.evaluationResult.findMany.mockResolvedValue([
      { overallScore: 85 },
      { overallScore: 90 },
    ]);

    const result = await service.getCandidateReport('user-1', 'attempt-1');
    expect(result.score).toBe(85);
    expect(result.rank).toBe(2);
    expect(result.percentile).toBe(0); // ((2-2)/(2-1))*100
    expect(result.strengths).toContain('React');
    expect(result.weaknesses).toContain('Node');
    expect(auditService.logReportViewed).toHaveBeenCalled();
  });
});
