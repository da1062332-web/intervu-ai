import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";

import { z } from "zod";
import { ValidateResponse } from "@intervu/shared";
import { QueueService, QueueType } from "../../../queue";

@ApiTags("queue-monitor")
@ApiBearerAuth("jwt-auth")
@Controller("queue")
export class QueueMonitorController {
  constructor(private readonly queueService: QueueService) {}

  @Get("status")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(z.unknown())
  @ApiOperation({
    summary:
      "Get metrics for all queues (waiting, active, completed, failed, delayed)",
  })
  @ApiOkResponse({
    description:
      "Metrics object for generation, evaluation, analytics, and validation queues",
  })
  async getAllQueueMetrics() {
    return this.queueService.getQueueMetrics();
  }

  @Get(":queue/status")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(z.unknown())
  @ApiOperation({ summary: "Get metrics for a specific queue" })
  @ApiParam({ name: "queue", enum: QueueType, example: QueueType.GENERATION })
  @ApiOkResponse({ description: "Metrics for the specified queue" })
  async getQueueMetrics(@Param("queue") queue: QueueType) {
    return this.queueService.getQueueCounts(queue);
  }

  @Post(":queue/retry/:jobId")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(z.unknown())
  @ApiOperation({ summary: "Retry a failed job in the specified queue" })
  @ApiParam({ name: "queue", enum: QueueType, example: QueueType.GENERATION })
  @ApiParam({
    name: "jobId",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    description: "BullMQ job UUID",
  })
  @ApiOkResponse({ description: "Job retry result" })
  async retryJob(
    @Param("queue") queue: QueueType,
    @Param("jobId") jobId: string,
  ) {
    const retried = await this.queueService.retryFailedJob(queue, jobId);
    return { retried, jobId, queue };
  }

  @Delete(":queue/job/:jobId")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(z.unknown())
  @ApiOperation({ summary: "Remove a job from the specified queue" })
  @ApiParam({ name: "queue", enum: QueueType, example: QueueType.GENERATION })
  @ApiParam({
    name: "jobId",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    description: "BullMQ job UUID",
  })
  @ApiOkResponse({ description: "Job removal result" })
  async removeJob(
    @Param("queue") queue: QueueType,
    @Param("jobId") jobId: string,
  ) {
    const removed = await this.queueService.removeJob(queue, jobId);
    return { removed, jobId, queue };
  }
}
