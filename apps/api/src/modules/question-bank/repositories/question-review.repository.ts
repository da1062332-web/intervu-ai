import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma, QuestionReview } from "@prisma/client";

@Injectable()
export class QuestionReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.QuestionReviewUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<QuestionReview> {
    const client = tx || this.prisma;
    return client.questionReview.create({ data });
  }

  async findByQuestionId(questionId: string): Promise<QuestionReview[]> {
    return this.prisma.questionReview.findMany({
      where: { questionId },
      orderBy: { createdAt: "desc" },
    });
  }
}
