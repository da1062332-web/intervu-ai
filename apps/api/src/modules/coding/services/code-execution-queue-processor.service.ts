import { Injectable, OnModuleInit, OnModuleDestroy, HttpException } from "@nestjs/common";
import { Worker, Job } from "bullmq";
import { AppLogger } from "@intervu-ai/shared-logger";
import { AppConfigService } from "../../../config/config.service";
import { buildQueueRedisConnection } from "../../../queue/queue-config";
import { QueueType, CodeExecutionQueueMessage } from "../../../queue/queue-payloads";
import { CodingExecutionService } from "./coding-execution.service";
import { RunCodeDto } from "../dto/run-code.dto";
import { SubmitCodeDto } from "../dto/submit-code.dto";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { HTTP_ERROR_PREFIX } from "./code-execution-queue.service";

const DEFAULT_CONCURRENCY = 20;

/**
 * Consumes the "code-execution" BullMQ queue. This is what actually keeps
 * concurrent Judge0 traffic bounded: however many HTTP requests arrive,
 * only `CODE_EXECUTION_CONCURRENCY` submissions are ever in flight against
 * Judge0 at once — everything else waits in the queue instead of piling
 * unboundedly onto a single external tunnel.
 *
 * Runs in-process inside the API (not apps/worker) because it needs the
 * full CodingExecutionService dependency graph (oracle registry, context
 * resolver, Prisma). When the deploy topology is split into a dedicated
 * worker service, this processor is the piece that should move with it.
 */
@Injectable()
export class CodeExecutionQueueProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new AppLogger({ name: "CodeExecutionQueueProcessor" });
  private worker!: Worker;

  constructor(
    private readonly configService: AppConfigService,
    private readonly codingExecutionService: CodingExecutionService,
  ) {}

  onModuleInit(): void {
    const connection = buildQueueRedisConnection(this.configService.redisUrl);
    const concurrency = Number(process.env.CODE_EXECUTION_CONCURRENCY) || DEFAULT_CONCURRENCY;

    this.worker = new Worker(QueueType.CODE_EXECUTION, this.process.bind(this), {
      connection,
      concurrency,
    });

    this.worker.on("failed", (job, error) => {
      this.logger.warn("Code execution job failed", {
        jobId: job?.id,
        error: error?.message,
      });
    });
    this.worker.on("error", (error) => {
      this.logger.error("Code execution worker error", error);
    });

    this.logger.info("Code execution queue processor started", { concurrency });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }

  private async process(job: Job<CodeExecutionQueueMessage>): Promise<unknown> {
    const { mode, dto, user } = job.data.payload;

    try {
      if (mode === "run") {
        return await this.codingExecutionService.runPublicTests(
          dto as RunCodeDto,
          user as AuthUser,
        );
      }
      return await this.codingExecutionService.submitFullEvaluation(
        dto as SubmitCodeDto,
        user as AuthUser,
      );
    } catch (err: any) {
      // Preserve the original HTTP status (400/403/404/etc.) across the
      // queue boundary — BullMQ only carries a plain string failure reason,
      // so CodeExecutionQueueService.unpackJobError reconstructs the
      // exception from this encoded prefix on the other side.
      if (err instanceof HttpException) {
        throw new Error(
          `${HTTP_ERROR_PREFIX}${JSON.stringify({ status: err.getStatus(), message: err.message })}`,
        );
      }
      throw err;
    }
  }
}
