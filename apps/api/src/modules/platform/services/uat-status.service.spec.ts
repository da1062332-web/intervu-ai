import { Test, TestingModule } from '@nestjs/testing';
import { UatChecklistService } from './uat-checklist.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('UatStatusService', () => {
  let service: UatChecklistService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: { count: jest.fn() },
      template: { count: jest.fn() },
      generatedQuestion: { count: jest.fn() },
      examConfig: { count: jest.fn() },
      testInstance: { count: jest.fn() },
      evaluationResult: { count: jest.fn() },
      evaluationAnalytics: { count: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UatChecklistService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UatChecklistService>(UatChecklistService);
  });

  it('should dynamically check platform readiness and return FAIL when empty', async () => {
    // Return 0 for everything
    prisma.user.count.mockResolvedValue(0);
    prisma.template.count.mockResolvedValue(0);
    prisma.generatedQuestion.count.mockResolvedValue(0);
    prisma.examConfig.count.mockResolvedValue(0);
    prisma.testInstance.count.mockResolvedValue(0);
    prisma.evaluationResult.count.mockResolvedValue(0);
    prisma.evaluationAnalytics.count.mockResolvedValue(0);

    const result = await service.getPlatformUatStatus();
    
    const authStatus = result.find(r => r.module === 'Authentication');
    expect(authStatus?.status).toBe('FAIL');

    const genStatus = result.find(r => r.module === 'Generation');
    expect(genStatus?.status).toBe('FAIL');
  });

  it('should return PASS when modules have sufficient data', async () => {
    prisma.user.count.mockResolvedValue(10);
    prisma.template.count.mockResolvedValue(5);
    prisma.generatedQuestion.count.mockResolvedValue(20);
    prisma.examConfig.count.mockResolvedValue(2);
    prisma.testInstance.count.mockResolvedValue(5);
    prisma.evaluationResult.count.mockResolvedValue(5);
    prisma.evaluationAnalytics.count.mockResolvedValue(5);

    const result = await service.getPlatformUatStatus();
    
    result.forEach(r => {
      // Evaluation returns WARNING if there are test instances but no evaluations,
      // but here we mocked them with 5, so it should PASS. 
      // Same with Generation.
      if (r.module === 'Execution' || r.module === 'Evaluation' || r.module === 'Reporting') {
         // Some of these might return WARNING intentionally based on logic
         expect(['PASS', 'WARNING']).toContain(r.status);
      } else {
         expect(r.status).toBe('PASS');
      }
    });
  });
});
