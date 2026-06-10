import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { TestInstanceStatus, Prisma } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

export type CreateTestInstanceData = {
  userId: string;
  testConfigId: string;
  status: TestInstanceStatus;
  expiresAt: Date;
  sections: {
    sectionKey: string;
    sectionName: string;
    durationSeconds: number;
    questionCount: number;
    orderIndex: number;
    questions: {
      questionId: string;
      questionOrder: number;
      questionSnapshot: Prisma.InputJsonValue;
    }[];
  }[];
};

@Injectable()
export class TestInstanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTestInstanceData) {
    const instanceId = createId();
    const queries: Prisma.PrismaPromise<unknown>[] = [];

    queries.push(
      this.prisma.testInstance.create({
        data: {
          id: instanceId,
          userId: data.userId,
          testConfigId: data.testConfigId,
          status: data.status,
          expiresAt: data.expiresAt,
        },
      })
    );

    for (const section of data.sections) {
      const sectionId = createId();
      queries.push(
        this.prisma.testInstanceSection.create({
          data: {
            id: sectionId,
            testInstanceId: instanceId,
            sectionKey: section.sectionKey,
            sectionName: section.sectionName,
            durationSeconds: section.durationSeconds,
            questionCount: section.questionCount,
            orderIndex: section.orderIndex,
          },
        })
      );

      if (section.questions.length > 0) {
        queries.push(
          this.prisma.testInstanceQuestion.createMany({
            data: section.questions.map((q) => ({
              testInstanceId: instanceId,
              sectionId: sectionId,
              questionId: q.questionId,
              questionOrder: q.questionOrder,
              questionSnapshot: q.questionSnapshot,
            })),
          })
        );
      }
    }

    await this.prisma.$transaction(queries);
    return this.findById(instanceId);
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
        status: { in: ["CREATED", "IN_PROGRESS"] },
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
