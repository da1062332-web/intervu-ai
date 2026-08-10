import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { TestInstanceStatus } from "@prisma/client";

@Injectable()
export class AttemptHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAttemptsByUser(params: {
    userId: string;
    skip: number;
    take: number;
  }) {
    const { userId, skip, take } = params;

    const where = {
      userId,
    };

    const [total, items] = await Promise.all([
      this.prisma.testInstance.count({ where }),
      this.prisma.testInstance.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          testConfig: {
            select: {
              displayName: true,
            },
          },
          examConfig: {
            select: {
              name: true,
              ruleFlags: true,
            },
          },
          evaluationResult: {
            select: {
              overallScore: true,
            },
          },
          candidateResult: {
            select: {
              score: true,
              percentage: true,
            },
          },
        },
      }),
    ]);

    return { total, items };
  }

  async countAttemptsByConfig(userId: string, examConfigId?: string | null, testConfigId?: string | null): Promise<number> {
    if (!examConfigId && !testConfigId) return 0;
    
    return this.prisma.testInstance.count({
      where: {
        userId,
        OR: [
          ...(examConfigId ? [{ examConfigId }] : []),
          ...(testConfigId ? [{ testConfigId }] : []),
        ],
      },
    });
  }
}
