import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class LaunchPrecheckService {
  constructor(private readonly prisma: PrismaService) {}

  async precheck(
    testId: string,
  ): Promise<{ allowed: boolean; reasons?: string[] }> {
    const reasons: string[] = [];

    // 1. Package Exists and Published
    const assembly = await this.prisma.assembledTest.findUnique({
      where: { id: testId },
    });

    if (!assembly) {
      reasons.push('Package does not exist');
      return { allowed: false, reasons };
    }

    if (assembly.status !== 'PUBLISHED') {
      reasons.push('Package is not published');
    }

    // 2. Runtime Generated
    const latestBuild = await this.prisma.runtimeBuild.findFirst({
      where: { testId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestBuild) {
      reasons.push('Runtime is not generated');
    } else if (latestBuild.status !== 'COMPLETED') {
      reasons.push(`Runtime generation is in state: ${latestBuild.status}`);
    }

    // 3. Validation Passed
    const latestValidation = await this.prisma.runtimeValidationLog.findFirst({
      where: { testId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestValidation) {
      reasons.push('Runtime validation has not run');
    } else if (!latestValidation.isValid) {
      reasons.push('Runtime validation failed');
    }

    return {
      allowed: reasons.length === 0,
      reasons: reasons.length > 0 ? reasons : undefined,
    };
  }
}
