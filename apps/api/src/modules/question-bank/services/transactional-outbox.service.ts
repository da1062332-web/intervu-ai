import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AppLogger } from "@intervu-ai/shared-logger";

export interface DomainEventPayload {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class TransactionalOutboxService {
  private readonly logger = new AppLogger({ name: "TransactionalOutboxService" });

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Writes a domain event to the Transactional Outbox inside an existing Prisma transaction or standard client.
   */
  async recordEvent(
    event: DomainEventPayload,
    tx?: any,
  ): Promise<void> {
    const client = tx || this.prisma;

    await client.transactionalOutbox.create({
      data: {
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        payload: event.payload as any,
        processed: false,
      },
    });

    this.logger.debug(
      `Recorded outbox event [${event.eventType}] for ${event.aggregateType}:${event.aggregateId}`,
    );
  }

  /**
   * Fetches unprocessed outbox events for background processing/relaying.
   */
  async fetchUnprocessedEvents(limit = 50) {
    return this.prisma.transactionalOutbox.findMany({
      where: { processed: false },
      take: limit,
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Marks events as processed.
   */
  async markAsProcessed(eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) return;
    await this.prisma.transactionalOutbox.updateMany({
      where: { id: { in: eventIds } },
      data: { processed: true },
    });
  }
}
