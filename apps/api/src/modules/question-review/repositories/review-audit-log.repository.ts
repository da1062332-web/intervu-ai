import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma, ReviewAuditLog } from "@prisma/client";

@Injectable()
export class ReviewAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.ReviewAuditLogUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<ReviewAuditLog> {
    const client = tx || this.prisma;
    return client.reviewAuditLog.create({ data });
  }

  async findByQuestionId(questionId: string): Promise<ReviewAuditLog[]> {
    return this.prisma.reviewAuditLog.findMany({
      where: { questionId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findMany(params: {
    where?: Prisma.ReviewAuditLogWhereInput;
    orderBy?: Prisma.ReviewAuditLogOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }): Promise<ReviewAuditLog[]> {
    return this.prisma.reviewAuditLog.findMany({
      where: params.where,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take,
    });
  }
}
