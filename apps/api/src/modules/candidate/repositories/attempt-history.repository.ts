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
          evaluationResult: {
            select: {
              overallScore: true,
            },
          },
        },
      }),
    ]);

    return { total, items };
  }
}
