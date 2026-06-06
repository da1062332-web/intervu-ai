import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import {
  SubmitExecutionDto,
  ExecutionResultDto,
  SubmitExecutionResponseDto,
} from "@/modules/execution/dto";
import * as crypto from "crypto";

@Injectable()
export class ExecutionService {
  private readonly logger = new AppLogger({ name: "ExecutionService" });

  constructor(private readonly redisCacheService: RedisCacheService) {}

  async submitAnswers(
    dto: SubmitExecutionDto,
  ): Promise<SubmitExecutionResponseDto> {
    this.logger.info("Received execution submission", { testId: dto.testId });

    // 1 & 2. Validate payload and test exists (mock validation for test existence)
    if (!dto.testId) {
      this.logger.warn("Validation failed: missing testId");
      throw new BadRequestException("Invalid payload");
    }

    // 3. Validate answer count and duplicates
    if (!dto.answers || dto.answers.length === 0) {
      this.logger.warn("Validation failed: empty answers");
      throw new BadRequestException("Answers cannot be empty");
    }

    const questionIds = new Set<string>();
    for (const ans of dto.answers) {
      if (questionIds.has(ans.questionId)) {
        this.logger.warn("Validation failed: duplicate questionId", {
          questionId: ans.questionId,
        });
        throw new BadRequestException(
          `Duplicate questionId found: ${ans.questionId}`,
        );
      }
      questionIds.add(ans.questionId);
    }

    // 4. Detect duplicate submission
    const alreadySubmitted = await this.redisCacheService.hasExecutionForTest(
      dto.testId,
    );
    if (alreadySubmitted) {
      this.logger.warn("Duplicate submission detected", { testId: dto.testId });
      throw new ConflictException(
        "Execution for this test has already been submitted",
      );
    }

    // 5. Generate executionId
    const executionId = crypto.randomUUID();

    // 6. Build execution object
    const executionData: ExecutionResultDto = {
      executionId,
      testId: dto.testId,
      answers: dto.answers,
      status: "submitted",
      submittedAt: new Date(),
    };

    // 7. Persist to Redis
    const isRedisAvailable = await this.redisCacheService.setExecution(
      executionId,
      executionData,
    );
    if (!isRedisAvailable) {
      this.logger.error(
        "Failed to persist execution due to Redis unavailability",
        null,
        { executionId },
      );
      throw new ServiceUnavailableException("Persistence layer unavailable");
    }

    // Set the secondary key for duplicate check (TTL of 30 days as an example)
    await this.redisCacheService.setExecutionForTest(
      dto.testId,
      executionId,
      30 * 24 * 3600,
    );

    this.logger.info("Execution submitted successfully", {
      executionId,
      testId: dto.testId,
    });

    // 8. Return response
    return {
      executionId,
      status: "submitted",
    };
  }

  async getExecutionResult(id: string): Promise<ExecutionResultDto> {
    this.logger.info("Fetching execution result", { executionId: id });

    // Retrieve via RedisCacheService
    const execution =
      await this.redisCacheService.getExecution<ExecutionResultDto>(id);

    if (!execution) {
      this.logger.warn("Execution not found", { executionId: id });
      throw new NotFoundException(`Execution with id ${id} not found`);
    }

    this.logger.info("Execution fetched successfully", { executionId: id });
    return execution;
  }
}
