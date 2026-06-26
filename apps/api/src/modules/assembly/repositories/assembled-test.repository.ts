import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma, AssemblyStatus } from "@prisma/client";
import { AllocatedSectionDto, AllocatedQuestionDto } from "@intervu/shared";

@Injectable()
export class AssembledTestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAssemblyWithTransaction(
    configId: string,
    sections: AllocatedSectionDto[],
    totalDurationSeconds: number,
    totalQuestions: number,
  ): Promise<string> {
    try {
      const result = await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // 1. Create Assembly
          const assembly = await tx.assembledTest.create({
            data: {
              configId,
              status: AssemblyStatus.DRAFT,
              totalDurationSeconds,
              totalQuestions,
            },
          });

          // 2. Create Sections and Questions
          for (const section of sections) {
            const testSection = await tx.assembledTestSection.create({
              data: {
                assemblyId: assembly.id,
                sectionKey: section.sectionKey,
                sectionName: section.displayName,
                durationSeconds: section.durationSeconds,
                questionCount: section.questionCount,
                orderIndex: section.orderIndex,
              },
            });

            if (section.questions.length > 0) {
              await tx.assembledTestQuestion.createMany({
                data: section.questions.map((q: AllocatedQuestionDto) => ({
                  assemblyId: assembly.id,
                  sectionId: testSection.id,
                  questionId: q.questionId,
                  questionOrder: q.questionOrder,
                  questionSnapshot: q.questionSnapshot as Prisma.InputJsonValue,
                })),
              });
            }
          }

          return assembly.id;
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

  async replaceAssemblyWithTransaction(
    assemblyId: string,
    sections: AllocatedSectionDto[],
    totalDurationSeconds: number,
    totalQuestions: number,
  ): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Update assembly totals
        await tx.assembledTest.update({
          where: { id: assemblyId },
          data: {
            totalDurationSeconds,
            totalQuestions,
          },
        });

        // Delete existing sections (cascading to questions)
        await tx.assembledTestSection.deleteMany({
          where: { assemblyId },
        });

        // Create new sections and questions
        for (const section of sections) {
          const testSection = await tx.assembledTestSection.create({
            data: {
              assemblyId,
              sectionKey: section.sectionKey,
              sectionName: section.displayName,
              durationSeconds: section.durationSeconds,
              questionCount: section.questionCount,
              orderIndex: section.orderIndex,
            },
          });

          if (section.questions.length > 0) {
            await tx.assembledTestQuestion.createMany({
              data: section.questions.map((q: AllocatedQuestionDto) => ({
                assemblyId,
                sectionId: testSection.id,
                questionId: q.questionId,
                questionOrder: q.questionOrder,
                questionSnapshot: q.questionSnapshot as Prisma.InputJsonValue,
              })),
            });
          }
        }
      });
    } catch (error) {
      throw new InternalServerErrorException(
        "Failed to replace assembly transaction",
        (error as Error).message,
      );
    }
  }

  async findById(id: string) {
    return this.prisma.assembledTest.findUnique({
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

  async updateStatus(id: string, status: AssemblyStatus) {
    return this.prisma.assembledTest.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string) {
    return this.prisma.assembledTest.delete({
      where: { id },
    });
  }
}
