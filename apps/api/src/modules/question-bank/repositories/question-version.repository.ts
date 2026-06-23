import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma, QuestionVersion } from "@prisma/client";

@Injectable()
export class QuestionVersionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.QuestionVersionUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<QuestionVersion> {
    const client = tx || this.prisma;
    return client.questionVersion.create({ data });
  }

  async createMany(
    data: Prisma.QuestionVersionCreateManyInput[],
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;
    const result = await client.questionVersion.createMany({ data });
    return result.count;
  }

  async findByQuestionId(questionId: string): Promise<QuestionVersion[]> {
    return this.prisma.questionVersion.findMany({
      where: { questionId },
      orderBy: { version: "desc" },
    });
  }
}
