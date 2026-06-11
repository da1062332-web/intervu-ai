import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TestInstanceStatus, Prisma } from '@prisma/client';
import { SectionDto } from './dto/section.dto';
import { AllocatedQuestionDto } from './dto/allocated-question.dto';

@Injectable()
export class AssemblyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTestInstanceWithTransaction(
    userId: string,
    testConfigId: string,
    sections: SectionDto[]
  ): Promise<string> {
    try {
      const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Create Test Instance
        const testInstance = await tx.testInstance.create({
          data: {
            userId,
            testConfigId,
            status: TestInstanceStatus.CREATED,
          },
        });

        // 2. Create Sections and Questions
        for (const section of sections) {
          const testSection = await tx.testInstanceSection.create({
            data: {
              testInstanceId: testInstance.id,
              sectionKey: section.sectionKey,
              sectionName: section.sectionName,
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
                questionSnapshot: q.questionSnapshot,
              })),
            });
          }
        }

        return testInstance.id;
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException('Failed to persist assembly transaction', (error as Error).message);
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
                questionOrder: 'asc'
              }
            }
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });
  }

  async findByCandidate(userId: string) {
    return this.prisma.testInstance.findMany({
      where: { userId },
      include: {
        sections: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}
