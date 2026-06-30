import { Injectable, Optional } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { BaseRepository } from "../../../common/repositories/base.repository";
import { Prisma, ExamWorkflow, ExamWorkflowHistory } from "@prisma/client";
import { WorkflowFilterDto } from "../dto/workflow-filter.dto";
import { ExamWorkflowWithConfig } from "../dto/workflow-mapper";

@Injectable()
export class WorkflowRepository extends BaseRepository<
  ExamWorkflow,
  Prisma.ExamWorkflowCreateInput,
  Prisma.ExamWorkflowUpdateInput
> {
  constructor(
    protected readonly prisma: PrismaService,
    @Optional() protected readonly tx?: Prisma.TransactionClient,
  ) {
    super(prisma, "examWorkflow", { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new WorkflowRepository(this.prisma, tx) as this;
  }

  async findByExamId(examId: string): Promise<ExamWorkflow | null> {
    return this.prisma.examWorkflow.findUnique({
      where: { examId },
    });
  }

  async findFiltered(
    filter: WorkflowFilterDto,
  ): Promise<{ items: ExamWorkflowWithConfig[]; total: number }> {
    const {
      search,
      status,
      step,
      createdAfter,
      createdBefore,
      updatedAfter,
      sortBy = "updatedAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = filter;

    const where: Prisma.ExamWorkflowWhereInput = {};

    if (status) where.status = status;
    if (step) where.currentStep = step;

    if (createdAfter || createdBefore) {
      where.createdAt = {};
      if (createdAfter) where.createdAt.gte = new Date(createdAfter);
      if (createdBefore) where.createdAt.lte = new Date(createdBefore);
    }

    if (updatedAfter) {
      where.updatedAt = { gte: new Date(updatedAfter) };
    }

    if (search) {
      where.OR = [
        { examId: { contains: search, mode: "insensitive" } },
        { examConfig: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const orderBy: Prisma.ExamWorkflowOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const limitInt = parseInt(String(limit), 10) || 20;
    const pageInt = parseInt(String(page), 10) || 1;
    const skip = (pageInt - 1) * limitInt;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.examWorkflow.findMany({
        where,
        orderBy,
        skip,
        take: limitInt,
        include: {
          examConfig: {
            select: { name: true },
          },
        },
      }),
      this.prisma.examWorkflow.count({ where }),
    ]);

    return { items: items as ExamWorkflowWithConfig[], total };
  }

  async addHistoryEntry(
    data: Prisma.ExamWorkflowHistoryCreateInput,
  ): Promise<ExamWorkflowHistory> {
    return this.prisma.examWorkflowHistory.create({ data });
  }

  async getHistory(workflowId: string): Promise<ExamWorkflowHistory[]> {
    return this.prisma.examWorkflowHistory.findMany({
      where: { workflowId },
      orderBy: { createdAt: "asc" },
    });
  }
}
