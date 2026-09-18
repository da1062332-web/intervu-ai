import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  HttpException,
  ServiceUnavailableException,
  GatewayTimeoutException,
  InternalServerErrorException,
} from "@nestjs/common";
import { QueueEvents } from "bullmq";
import { AppLogger } from "@intervu-ai/shared-logger";
import { AppConfigService } from "../../../config/config.service";
import { QueueFactory, buildQueueRedisConnection } from "../../../queue/queue-config";
import { QueueService } from "../../../queue/queue.service";
import { QueueType } from "../../../queue/queue-payloads";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";

/**
 * Marker prefix used by CodeExecutionQueueProcessorService to smuggle an
 * HTTP status code through a BullMQ job failure (which only carries a plain
 * string reason). See unpackJobError below for the other half.
 */
const HTTP_ERROR_PREFIX = "__HTTP_ERR__:";

/**
 * How many code-execution jobs are allowed to be waiting + active before new
 * requests are rejected outright instead of piling up behind the single
 * Judge0 instance. This is the backpressure valve: it protects Judge0 from
 * unbounded concurrent load and gives candidates a fast, honest "try again"
 * instead of a request that silently hangs for a minute.
 */
const DEFAULT_MAX_QUEUE_DEPTH = 500;

@Injectable()
export class CodeExecutionQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new AppLogger({ name: "CodeExecutionQueueService" });
  private queueEvents!: QueueEvents;
  private readonly maxQueueDepth: number;

  constructor(
    private readonly configService: AppConfigService,
    private readonly queueService: QueueService,
  ) {
    this.maxQueueDepth = Number(process.env.CODE_EXECUTION_MAX_QUEUE_DEPTH) || DEFAULT_MAX_QUEUE_DEPTH;
  }

  onModuleInit(): void {
    const connection = buildQueueRedisConnection(this.configService.redisUrl);
    this.queueEvents = new QueueEvents(QueueType.CODE_EXECUTION, { connection });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queueEvents?.close();
  }

  /**
   * Enqueues a run/submit job and awaits its result, preserving the existing
   * synchronous request/response contract for the frontend while the actual
   * Judge0 work happens in a bounded-concurrency queue consumer instead of
   * unboundedly inline in the HTTP handler.
   */
  async execute<TResult = unknown>(
    mode: "run" | "submit",
    dto: unknown,
    user: AuthUser,
    timeoutMs: number,
  ): Promise<TResult> {
    const queue = QueueFactory.getQueue(QueueType.CODE_EXECUTION);
    const counts = await queue.getJobCounts("waiting", "active");
    const inFlight = (counts.waiting || 0) + (counts.active || 0);
    if (inFlight >= this.maxQueueDepth) {
      this.logger.warn("Code execution queue at capacity — rejecting request", {
        inFlight,
        maxQueueDepth: this.maxQueueDepth,
      });
      throw new ServiceUnavailableException(
        "The code execution engine is at capacity. Please try again in a few seconds.",
      );
    }

    const job = await this.queueService.enqueueCodeExecution({
      jobId: `code-exec:${mode}:${user.id}:${(dto as any)?.questionId || "unknown"}:${Date.now()}`,
      timestamp: Date.now(),
      userId: user.id,
      payload: { mode, dto, user },
    });

    try {
      const result = await job.waitUntilFinished(this.queueEvents, timeoutMs);
      return result as TResult;
    } catch (err: any) {
      throw this.unpackJobError(err, mode);
    }
  }

  private unpackJobError(err: any, mode: "run" | "submit"): Error {
    const message = String(err?.message || err || "");

    if (message.startsWith(HTTP_ERROR_PREFIX)) {
      try {
        const { status, message: originalMessage } = JSON.parse(
          message.slice(HTTP_ERROR_PREFIX.length),
        );
        return new HttpException(originalMessage, status);
      } catch {
        // fall through to generic handling below
      }
    }

    if (/timed out/i.test(message)) {
      return new GatewayTimeoutException(
        `Code ${mode === "run" ? "run" : "submission"} timed out waiting for the execution engine.`,
      );
    }

    this.logger.error("Unhandled code execution job failure", err, { mode });
    return new InternalServerErrorException(
      "Code execution failed unexpectedly. Please try again.",
    );
  }
}

export { HTTP_ERROR_PREFIX };
