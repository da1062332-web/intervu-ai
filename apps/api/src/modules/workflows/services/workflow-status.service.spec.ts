import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowStatusService } from './workflow-status.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowStep, WorkflowStatus, Prisma } from '@prisma/client';

describe('WorkflowStatusService', () => {
  let service: WorkflowStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowStatusService,
        {
          provide: PrismaService,
          useValue: {
            examConfig: { findUnique: jest.fn().mockResolvedValue({ id: '1', status: 'DRAFT' }) },
            assembledTest: { findFirst: jest.fn().mockResolvedValue(null) },
          },
        },
      ],
    }).compile();

    service = module.get<WorkflowStatusService>(WorkflowStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should aggregate status successfully', async () => {
    const mockWorkflow = {
      id: 'w1',
      examId: 'e1',
      currentStep: WorkflowStep.CONFIGURATION,
      status: WorkflowStatus.COMPLETED,
      completionPercentage: 20,
      metadata: null as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };
    
    const status = await service.aggregateStatus(mockWorkflow);
    expect(status.configuration).toBeDefined();
    expect(status.questionGeneration).toBeDefined();
    expect(status.questionReview).toBeDefined();
    expect(status.assembly).toBeDefined();
    expect(status.publishing).toBeDefined();
  });
});
