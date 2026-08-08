import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { BatchState } from "@prisma/client";
import { AppLogger } from "@intervu-ai/shared-logger";
import { TransactionalOutboxService } from "./transactional-outbox.service";

export interface CreateBatchDto {
  topicId: string;
  conceptId?: string;
  sourceType: string; // "MANUAL" | "VARIABLE_TEMPLATE"
  totalCount: number;
}

@Injectable()
export class QuestionBatchService {
  private readonly logger = new AppLogger({ name: "QuestionBatchService" });

  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxService: TransactionalOutboxService,
  ) {}

  /**
   * Creates a new QuestionBatch in PENDING state and assigns next batchNumber for topic.
   */
  async createBatch(dto: CreateBatchDto) {
    const lastBatch = await this.prisma.questionBatch.findFirst({
      where: { topicId: dto.topicId },
      orderBy: { batchNumber: "desc" },
    });

    const batchNumber = (lastBatch?.batchNumber ?? 0) + 1;

    const batch = await this.prisma.questionBatch.create({
      data: {
        batchNumber,
        topicId: dto.topicId,
        conceptId: dto.conceptId,
        sourceType: dto.sourceType,
        state: BatchState.PENDING,
        totalCount: dto.totalCount,
        validCount: 0,
      },
    });

    await this.outboxService.recordEvent({
      aggregateType: "QuestionBatch",
      aggregateId: batch.id,
      eventType: "batch.created",
      payload: {
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        topicId: batch.topicId,
        sourceType: batch.sourceType,
      },
    });

    this.logger.info(
      `Created QuestionBatch #${batchNumber} (${batch.id}) for topic ${dto.topicId}`,
    );
    return batch;
  }

  /**
   * Updates batch state and handles partial validation recovery.
   */
  async updateBatchState(
    batchId: string,
    state: BatchState,
    validCount?: number,
    errors?: Array<{ rawText?: string; reason: string }>,
  ) {
    const existing = await this.prisma.questionBatch.findUnique({
      where: { id: batchId },
    });

    if (!existing) {
      throw new NotFoundException(`QuestionBatch with ID ${batchId} not found`);
    }

    // Record error logs if provided
    if (errors && errors.length > 0) {
      await this.prisma.questionBatchError.createMany({
        data: errors.map((e) => ({
          batchId,
          rawText: e.rawText,
          reason: e.reason,
        })),
      });
    }

    const updated = await this.prisma.questionBatch.update({
      where: { id: batchId },
      data: {
        state,
        validCount: validCount ?? existing.validCount,
      },
    });

    await this.outboxService.recordEvent({
      aggregateType: "QuestionBatch",
      aggregateId: batchId,
      eventType: `batch.${state.toLowerCase()}`,
      payload: {
        batchId,
        batchNumber: updated.batchNumber,
        state,
        validCount: updated.validCount,
        totalCount: updated.totalCount,
      },
    });

    return updated;
  }

  /**
   * Fetches batch details with error logs and linked questions.
   */
  async getBatchDetails(batchId: string) {
    const batch = await this.prisma.questionBatch.findUnique({
      where: { id: batchId },
      include: {
        errors: true,
        questions: {
          take: 50,
          select: {
            id: true,
            questionText: true,
            difficulty: true,
            status: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`QuestionBatch ${batchId} not found`);
    }

    return batch;
  }

  /**
   * Lists batches for a given topic.
   */
  async listBatchesByTopic(topicId: string) {
    return this.prisma.questionBatch.findMany({
      where: { topicId },
      orderBy: { batchNumber: "desc" },
      include: {
        errors: true,
      },
    });
  }
}
