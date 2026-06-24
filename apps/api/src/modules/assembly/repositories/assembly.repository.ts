import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { TestInstanceStatus, Prisma } from "@prisma/client";
import { AllocatedSectionDto as SectionDto } from "@intervu/shared";
import { AllocatedQuestionDto } from "@intervu/shared";

@Injectable()
export class AssemblyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTestInstanceWithTransaction(
    userId: string,
    testConfigId: string,
    sections: SectionDto[],
  ): Promise<string> {
    try {
      const result = await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // Hack for MVP: Ensure we have a valid testConfigId because ExamConfig.id is not a TestConfig.id
          let validTestConfigId = testConfigId;
          const configExists = await tx.testConfig.findUnique({
            where: { id: testConfigId },
          });
          if (!configExists) {
            const anyConfig = await tx.testConfig.findFirst();
            if (anyConfig) {
              validTestConfigId = anyConfig.id;
            } else {
              const newConfig = await tx.testConfig.create({
                data: {
                  configKey: `mock-config-${Date.now()}`,
                  companyName: "Mock Company",
                  displayName: "Mock Config",
                  totalDurationSeconds: 3600,
                  totalQuestions: 10,
                },
              });
              validTestConfigId = newConfig.id;
            }
          }

          // 1. Create Test Instance
          const testInstance = await tx.testInstance.create({
            data: {
              userId,
              testConfigId: validTestConfigId,
              status: TestInstanceStatus.CREATED,
            },
          });

          // 2. Create Sections and Questions
          for (const section of sections) {
            const testSection = await tx.testInstanceSection.create({
              data: {
                testInstanceId: testInstance.id,
                sectionKey: section.sectionKey,
                sectionName: section.displayName,
                durationSeconds: section.durationSeconds,
                questionCount: section.questionCount,
                orderIndex: section.orderIndex,
              },
            });

            if (section.questions.length > 0) {
              await tx.testInstanceQuestion.createMany({
                data: section.questions.map((q: AllocatedQuestionDto) => ({
                  testInstanceId: testInstance.id,
                  sectionId: testSection.id,
                  questionId: q.questionId,
                  questionOrder: q.questionOrder,
                  questionSnapshot: q.questionSnapshot as Prisma.InputJsonValue,
                })),
              });
            }
          }

          return testInstance.id;
        },
      );

      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        "Failed to persist assembly transaction",
        (error as Error).message,
      );
    }
  }

  async findById(id: string) {
    return this.prisma.testInstance.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            questions: {
              orderBy: {
                questionOrder: "asc",
              },
            },
          },
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
    });
  }

  async findByCandidate(userId: string) {
    return this.prisma.testInstance.findMany({
      where: { userId },
      include: {
        sections: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
