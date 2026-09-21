import {
  Injectable,
  InternalServerErrorException,
  Inject,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma, AssemblyStatus } from "@prisma/client";
import { AllocatedSectionDto, AllocatedQuestionDto } from "@intervu/shared";

@Injectable()
export class AssembledTestRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createAssemblyWithTransaction(
    configId: string,
    sections: AllocatedSectionDto[],
    totalDurationSeconds: number,
    totalQuestions: number,
  ): Promise<string> {
    try {
      // Resolve valid ExamConfig ID (or bridge from TestConfig if necessary)
      let targetExamConfigId = configId;
      const examConfig = await this.prisma.examConfig.findFirst({
        where: { OR: [{ id: configId }, { code: configId }] },
        select: { id: true },
      });
      if (examConfig) {
        targetExamConfigId = examConfig.id;
      } else {
        const testConfig = await this.prisma.testConfig.findFirst({
          where: { OR: [{ id: configId }, { configKey: configId }] },
        });
        if (testConfig) {
          const bridgedExam = await this.prisma.examConfig.upsert({
            where: { id: testConfig.id },
            update: {},
            create: {
              id: testConfig.id,
              name: testConfig.displayName,
              code: testConfig.configKey,
              role: testConfig.companyName || "Candidate",
              durationMinutes: Math.max(1, Math.ceil(testConfig.totalDurationSeconds / 60)),
              totalQuestions: testConfig.totalQuestions || 10,
              status: "PUBLISHED",
            },
          });
          targetExamConfigId = bridgedExam.id;
        }
      }

      const result = await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // 1. Create Assembly
          const assembly = await tx.assembledTest.create({
            data: {
              configId: targetExamConfigId,
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
        { maxWait: 60000, timeout: 180000 },
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
      await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
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
        },
        { maxWait: 60000, timeout: 180000 },
      );
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
        examConfig: {
          select: {
            id: true,
            name: true,
            role: true,
            code: true,
            ruleFlags: true,
          },
        },
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

  async findByConfigId(configId: string) {
    return this.prisma.assembledTest.findFirst({
      where: { configId },
      orderBy: { createdAt: "desc" },
      include: {
        examConfig: {
          select: {
            updatedAt: true,
          },
        },
        sections: {
          include: {
            questions: {
              orderBy: { questionOrder: "asc" },
            },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });
  }

  async findLatestReusableByConfigId(configId: string) {
    const assembly = await this.prisma.assembledTest.findFirst({
      where: {
        configId,
        totalQuestions: { gt: 0 },
        // Strictly only accept formally PUBLISHED master assemblies
        status: AssemblyStatus.PUBLISHED,
        sections: {
          // At least one section must exist with questions
          some: {
            questions: { some: {} },
          },
          // No section is allowed to have zero questions (strictly rejects partial drafts)
          none: {
            questions: { none: {} },
          },
        },
      },
      select: {
        id: true,
        configId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        examConfig: {
          select: {
            updatedAt: true,
            ruleFlags: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!assembly) return null;

    // Stale check: If examConfig was updated AFTER this pre-assembled test was created/updated,
    // the pre-assembled test is STALE and cannot be reused!
    if (
      assembly.examConfig?.updatedAt &&
      new Date(assembly.updatedAt).getTime() < new Date(assembly.examConfig.updatedAt).getTime()
    ) {
      return null;
    }

    return assembly;
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
