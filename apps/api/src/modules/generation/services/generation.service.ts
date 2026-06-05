import { Injectable, BadRequestException } from "@nestjs/common";
import { randomUUID } from "crypto";

import { QueueService, QueueType } from "../../../queue";
import { RedisCacheService } from "../../../cache";
import { GenerateQuestionRequestDto } from "@intervu/shared";

export interface EnqueueGenerationResult {
  jobId: string;
  status: "queued";
  assemblyId: string;
  queuedAt: string;
}

export interface GenerationStatusResult {
  jobId: string;
  status: string | undefined;
  result: unknown;
}

@Injectable()
export class GenerationService {
  constructor(
    private readonly queueService: QueueService,
    private readonly cacheService: RedisCacheService,
  ) {}

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async enqueueGeneration(
    dto: GenerateQuestionRequestDto,
  ): Promise<EnqueueGenerationResult> {
    // 1. validate() — Fail Fast via Zod
    const validation = GenerateQuestionRequestDto.validate(dto);
    if (!validation.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid generation request",
          details: validation.error.format(),
        },
      });
    }
    const validated = validation.data;

    // 2. fetchDependencies() — no external deps needed for enqueue

    // 3. coreLogic() — build job payload and enqueue to BullMQ
    const jobId = randomUUID();
    const assemblyId = randomUUID();

    await this.queueService.enqueueGeneration({
      jobId,
      timestamp: Date.now(),
      correlationId: randomUUID(),
      payload: {
        assemblyId,
        difficulty: validated.difficulty,
        count: validated.count,
        topicId: validated.topic,
      },
    });

    // 4. formatResponse()
    return {
      jobId,
      status: "queued",
      assemblyId,
      queuedAt: new Date().toISOString(),
    };
  }

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async getGenerationStatus(jobId: string): Promise<GenerationStatusResult> {
    // 1. validate()
    if (!jobId || jobId.trim().length === 0) {
      throw new BadRequestException({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "jobId is required" },
      });
    }

    // 2. fetchDependencies() — check Redis cache for a completed result
    const cachedResult =
      await this.cacheService.getGenerationResult<unknown>(jobId);

    // 3. coreLogic() — if not cached, check live BullMQ job state
    const jobState = await this.queueService.getJobState(
      QueueType.GENERATION,
      jobId,
    );

    // 4. formatResponse()
    return {
      jobId,
      status: jobState ?? (cachedResult ? "completed" : "unknown"),
      result: cachedResult,
    };
  }
}
