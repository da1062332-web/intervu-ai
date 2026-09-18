import { Global, Module, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { AppConfigService, ConfigModule } from "../config";
import { QueueFactory, buildQueueRedisConnection } from "./queue-config";
import { QueueService } from "./queue.service";
import { PrismaService } from "../prisma/prisma.service";

/**
 * QueueModule — Global NestJS DI wrapper for QueueService and QueueFactory.
 *
 * On module init, creates all BullMQ queues using the Redis URL from
 * AppConfigService. On module destroy, gracefully closes all queue connections.
 *
 * Declaring this @Global() means all modules can inject QueueService
 * without importing QueueModule themselves.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: QueueService,
      useFactory: (
        configService: AppConfigService,
        prisma: PrismaService,
      ): QueueService => {
        const logger = new AppLogger({ name: "QueueService" });

        /**
         * Connection options passed directly to ioredis by BullMQ.
         *
         * retryStrategy: null → ioredis stops reconnecting immediately when Redis
         * is unavailable.  Without this, BullMQ's default strategy floods the
         * console with ECONNREFUSED errors every few seconds.
         *
         * enableOfflineQueue: false → commands fail fast instead of queuing
         * up indefinitely when the connection is not ready.
         */
        const connection = buildQueueRedisConnection(configService.redisUrl);

        // Initialize all queues eagerly on module startup
        QueueFactory.createQueue("generation", connection);
        QueueFactory.createQueue("evaluation", connection);
        QueueFactory.createQueue("analytics", connection);
        QueueFactory.createQueue("validation", connection);
        QueueFactory.createQueue("code-execution", connection);

        return new QueueService(logger, prisma);
      },
      inject: [AppConfigService, PrismaService],
    },
  ],
  exports: [QueueService],
})
export class QueueModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new AppLogger({ name: "QueueModule" });

  onModuleInit(): void {
    this.logger.info("QueueModule initialized — all BullMQ queues created");
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.info("QueueModule destroying — closing all BullMQ queues");
    await QueueFactory.closeAll();
  }
}
