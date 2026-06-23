import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma, Question, QuestionStatus } from "@prisma/client";

@Injectable()
export class QuestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.QuestionUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Question> {
    const client = tx || this.prisma;
    return client.question.create({ data });
  }

  async createMany(
    data: Prisma.QuestionCreateManyInput[],
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;
    const result = await client.question.createMany({ data });
    return result.count;
  }

  async findById(id: string): Promise<Question | null> {
    return this.prisma.question.findUnique({
      where: { id },
    });
  }

  async update(
    id: string,
    data: Prisma.QuestionUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Question> {
    const client = tx || this.prisma;
    return client.question.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<Question> {
    const client = tx || this.prisma;
    return client.question.delete({
      where: { id },
    });
  }

  async findMany(params: {
    where: Prisma.QuestionWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.QuestionOrderByWithRelationInput;
  }): Promise<Question[]> {
    const { where, skip, take, orderBy } = params;
    return this.prisma.question.findMany({
      where,
      skip,
      take,
      orderBy,
    });
  }

  async count(where: Prisma.QuestionWhereInput): Promise<number> {
    return this.prisma.question.count({ where });
  }

  async getStats(where: Prisma.QuestionWhereInput) {
    const [total, active, draft, archived] = await Promise.all([
      this.prisma.question.count({
        where: {
          ...where,
          status: { not: QuestionStatus.ARCHIVED },
        },
      }),
      this.prisma.question.count({
        where: {
          ...where,
          status: QuestionStatus.ACTIVE,
        },
      }),
      this.prisma.question.count({
        where: {
          ...where,
          status: { in: [QuestionStatus.DRAFT, QuestionStatus.VALIDATED] },
        },
      }),
      this.prisma.question.count({
        where: {
          ...where,
          status: QuestionStatus.ARCHIVED,
        },
      }),
    ]);

    return {
      totalQuestions: total,
      activeQuestions: active,
      draftQuestions: draft,
      archivedQuestions: archived,
    };
  }

  async findQuestionsForSimilarity(
    topicId: string,
    sectionId: string,
  ): Promise<Pick<Question, "id" | "questionText">[]> {
    return this.prisma.question.findMany({
      where: {
        topicId,
        sectionId,
        status: { not: QuestionStatus.ARCHIVED },
      },
      select: {
        id: true,
        questionText: true,
      },
    });
  }

  async bulkInsert(
    params: {
      questions: Prisma.QuestionCreateManyInput[];
      versions: Prisma.QuestionVersionCreateManyInput[];
      usages: Prisma.QuestionUsageCreateManyInput[];
      legacyQuestions: Prisma.GeneratedQuestionCreateManyInput[];
    },
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;
    await client.question.createMany({ data: params.questions });
    await client.questionVersion.createMany({ data: params.versions });
    await client.questionUsage.createMany({ data: params.usages });
    if (params.legacyQuestions.length > 0) {
      await client.generatedQuestion.createMany({
        data: params.legacyQuestions,
      });
    }
    return params.questions.length;
  }
}
