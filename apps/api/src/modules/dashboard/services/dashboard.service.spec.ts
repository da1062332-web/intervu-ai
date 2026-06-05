import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardRepository } from '../repositories/dashboard.repository';

describe('DashboardService', () => {
  let service: DashboardService;
  let repository: DashboardRepository;

  beforeEach(async () => {
    const mockRepository = {
      getStatsByUserId: jest.fn(),
      getAnalyticsSummaryByUserId: jest.fn(),
      getRecentActivityByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: DashboardRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    repository = module.get<DashboardRepository>(DashboardRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    it('should validate empty userId', async () => {
      await expect(service.getStats('')).rejects.toThrow(NotFoundException);
    });

    it('should calculate statistics correctly', async () => {
      jest.spyOn(repository, 'getStatsByUserId').mockResolvedValue({
        testsTaken: 12,
        totalSessions: 15,
        averageScore: 84.4,
      });

      const result = await service.getStats('user-1');

      expect(repository.getStatsByUserId).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        testsTaken: 12,
        totalSessions: 15,
        completionRate: 80, // Math.round((12 / 15) * 100)
        averageScore: 84, // Math.round(84.4)
      });
    });

    it('should handle zero sessions/tests safely to prevent NaN', async () => {
      jest.spyOn(repository, 'getStatsByUserId').mockResolvedValue({
        testsTaken: 0,
        totalSessions: 0,
        averageScore: null,
      });

      const result = await service.getStats('user-1');

      expect(result).toEqual({
        testsTaken: 0,
        totalSessions: 0,
        completionRate: 0,
        averageScore: 0,
      });
    });
  });

  describe('getAnalyticsSummary', () => {
    it('should validate empty userId', async () => {
      await expect(service.getAnalyticsSummary('')).rejects.toThrow(NotFoundException);
    });

    it('should map analytics summary correctly', async () => {
      jest.spyOn(repository, 'getAnalyticsSummaryByUserId').mockResolvedValue({
        communicationScore: 81.6,
        technicalScore: 78.2,
        confidenceScore: 87.5,
        overallRating: 4.26,
      });

      const result = await service.getAnalyticsSummary('user-1');

      expect(repository.getAnalyticsSummaryByUserId).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        communicationScore: 82, // Math.round(81.6)
        technicalScore: 78, // Math.round(78.2)
        confidenceScore: 88, // Math.round(87.5)
        overallRating: 4.3, // parseFloat(4.26.toFixed(1))
      });
    });

    it('should handle all-null aggregate values by defaulting to zero', async () => {
      jest.spyOn(repository, 'getAnalyticsSummaryByUserId').mockResolvedValue({
        communicationScore: null,
        technicalScore: null,
        confidenceScore: null,
        overallRating: null,
      });

      const result = await service.getAnalyticsSummary('user-1');

      expect(result).toEqual({
        communicationScore: 0,
        technicalScore: 0,
        confidenceScore: 0,
        overallRating: 0.0,
      });
    });
  });

  describe('getRecentActivity', () => {
    it('should validate empty userId', async () => {
      await expect(service.getRecentActivity('')).rejects.toThrow(NotFoundException);
    });

    it('should return recent activities mapped correctly', async () => {
      const mockCompletedAt = new Date('2026-06-04T10:30:00Z');
      jest.spyOn(repository, 'getRecentActivityByUserId').mockResolvedValue([
        {
          id: 'test-1',
          completedAt: mockCompletedAt,
          template: {
            name: 'Frontend Interview',
          },
        },
      ] as unknown as Awaited<ReturnType<typeof repository.getRecentActivityByUserId>>);

      const result = await service.getRecentActivity('user-1');

      expect(repository.getRecentActivityByUserId).toHaveBeenCalledWith('user-1', 10);
      expect(result).toEqual([
        {
          id: 'test-1',
          type: 'interview_completed',
          title: 'Frontend Interview',
          createdAt: mockCompletedAt.toISOString(),
        },
      ]);
    });

    it('should return empty list when no activities exist', async () => {
      jest.spyOn(repository, 'getRecentActivityByUserId').mockResolvedValue([]);

      const result = await service.getRecentActivity('user-1');

      expect(result).toEqual([]);
    });
  });
});
