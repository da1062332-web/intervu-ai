import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TestInstanceStatus } from '@prisma/client';

export type CreateTestInstanceData = {
  userId: string;
  testConfigId: string;
  status: TestInstanceStatus;
  expiresAt: Date;
  sections: {
    sectionKey: string;
    status: TestInstanceStatus;
    questions: {
      questionHash: string;
      orderIndex: number;
      status: TestInstanceStatus;
    }[];
  }[];
};

@Injectable()
export class TestInstanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTestInstanceData) {
    return this.prisma.$transaction(async (tx) => {
      const testInstance = await tx.testInstance.create({
        data: {
          userId: data.userId,
          testConfigId: data.testConfigId,
          status: data.status,
          expiresAt: data.expiresAt,
          sections: {
            create: data.sections.map((section) => ({
              sectionKey: section.sectionKey,
              status: section.status,
              questions: {
                create: section.questions.map((question) => ({
                  questionHash: question.questionHash,
                  orderIndex: question.orderIndex,
                  status: question.status,
                })),
              },
            })),
          },
        },
        include: {
          sections: {
            include: {
              questions: true,
            },
          },
        },
      });

      return testInstance;
    });
  }

  async findById(id: string) {
    return this.prisma.testInstance.findUnique({
      where: { id },
      include: {
        sections: {
          include: { questions: true },
        },
      },
    });
  }

  async findActiveByUser(userId: string, testConfigId: string) {
    return this.prisma.testInstance.findFirst({
      where: {
        userId,
        testConfigId,
        status: { in: ['CREATED', 'IN_PROGRESS'] },
      },
    });
  }

  async updateStatus(id: string, status: TestInstanceStatus) {
    return this.prisma.testInstance.update({
      where: { id },
      data: { status },
    });
  }

  async countAttempts(userId: string, testConfigId: string) {
    return this.prisma.testInstance.count({
      where: {
        userId,
        testConfigId,
      },
    });
  }
}
