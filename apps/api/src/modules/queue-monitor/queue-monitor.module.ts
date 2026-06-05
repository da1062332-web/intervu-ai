import { Module } from "@nestjs/common";
import { QueueMonitorController } from "./controllers/queue-monitor.controller";

/**
 * QueueMonitorModule — exposes monitoring endpoints for all BullMQ queues.
 *
 * QueueService is injected from the global QueueModule — no re-import needed.
 */
@Module({
  controllers: [QueueMonitorController],
})
export class QueueMonitorModule {}
