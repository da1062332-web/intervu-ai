import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DashboardStats,
  DashboardAnalyticsSummary,
  DashboardActivityItem,
} from '@intervu/shared';
import { DashboardRepository } from '../repositories/dashboard.repository';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getStats(userId: string): Promise<DashboardStats> {
    // 1. Validate
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new NotFoundException('User ID is required');
    }

    // 2. Fetch dependencies
    const rawStats = await this.dashboardRepository.getStatsByUserId(userId);

    // 3. Core logic
    const testsTaken = rawStats.testsTaken;
    const totalSessions = rawStats.totalSessions;
    const completionRate =
      totalSessions > 0 ? Math.round((testsTaken / totalSessions) * 100) : 0;
    const averageScore =
      rawStats.averageScore !== null ? Math.round(rawStats.averageScore) : 0;

    // 4. Format response
    return {
      testsTaken,
      averageScore,
      completionRate,
      totalSessions,
    };
  }

  async getAnalyticsSummary(userId: string): Promise<DashboardAnalyticsSummary> {
    // 1. Validate
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new NotFoundException('User ID is required');
    }

    // 2. Fetch dependencies
    const rawSummary = await this.dashboardRepository.getAnalyticsSummaryByUserId(userId);

    // 3. Core logic
    const communicationScore =
      rawSummary.communicationScore !== null
        ? Math.round(rawSummary.communicationScore)
        : 0;
    const technicalScore =
      rawSummary.technicalScore !== null
        ? Math.round(rawSummary.technicalScore)
        : 0;
    const confidenceScore =
      rawSummary.confidenceScore !== null
        ? Math.round(rawSummary.confidenceScore)
        : 0;
    const overallRating =
      rawSummary.overallRating !== null
        ? parseFloat(rawSummary.overallRating.toFixed(1))
        : 0.0;

    // 4. Format response
    return {
      communicationScore,
      technicalScore,
      confidenceScore,
      overallRating,
    };
  }

  async getRecentActivity(userId: string): Promise<DashboardActivityItem[]> {
    // 1. Validate
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new NotFoundException('User ID is required');
    }

    // 2. Fetch dependencies
    const rawActivity = await this.dashboardRepository.getRecentActivityByUserId(userId, 10);

    // 3. Core logic & 4. Format response
    return rawActivity.map((test) => {
      // CompletedAt is guaranteed non-null from the repository query level
      const completedAtDate = test.completedAt as Date;
      return {
        id: test.id,
        type: 'interview_completed' as const,
        title: test.template.name,
        createdAt: completedAtDate.toISOString(),
      };
    });
  }
}
