import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RuntimeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createBuild(
    testId: string,
    status: string,
    durationMs: number,
    metadata?: any,
  ): Promise<void> {
    await this.prisma.runtimeBuild.create({
      data: {
        testId,
        status,
        durationMs,
        metadata: metadata || {},
      },
    });
  }

  async updateBuild(
    testId: string,
    status: string,
    durationMs: number,
    errors?: any,
  ): Promise<void> {
    // Update the latest started build for this testId
    const build = await this.prisma.runtimeBuild.findFirst({
      where: { testId },
      orderBy: { createdAt: 'desc' },
    });
    if (build) {
      await this.prisma.runtimeBuild.update({
        where: { id: build.id },
        data: { status, durationMs, errors: errors || {} },
      });
    } else {
      await this.createBuild(testId, status, durationMs, errors);
    }
  }

  async logValidation(
    testId: string,
    isValid: boolean,
    errors?: string[],
    metadata?: any,
  ): Promise<void> {
    await this.prisma.runtimeValidationLog.create({
      data: {
        testId,
        isValid,
        errors: errors || [],
        metadata: metadata || {},
      },
    });
  }

  async createMetric(
    testId: string,
    metricName: string,
    metricValue: number,
    metadata?: any,
  ): Promise<void> {
    await this.prisma.runtimeMetric.create({
      data: {
        testId,
        metricName,
        metricValue,
        metadata: metadata || {},
      },
    });
  }
}
