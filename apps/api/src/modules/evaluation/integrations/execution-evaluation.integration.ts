import { Injectable } from "@nestjs/common";
import { EvaluationAdapter } from "../../execution/interfaces/evaluation-adapter.interface";
import { ExecutionResultDto } from "../../execution/dto/execution-result.dto";
import { ResultGeneratorService } from "../services/result-generator.service";
import { ResultStorageService } from "../services/result-storage.service";
import { AppLogger } from "@intervu-ai/shared-logger";

@Injectable()
export class ExecutionEvaluationIntegration implements EvaluationAdapter {
  private readonly logger = new AppLogger({ name: "ExecutionEvaluationIntegration" });

  constructor(
    private readonly resultGenerator: ResultGeneratorService,
    private readonly resultStorage: ResultStorageService,
  ) {}

  /**
   * Automatically triggered on candidate submission.
   * Runs the evaluation generator and persists results to candidate_results, evaluation_runs, and evaluation_analytics.
   */
  async triggerEvaluation(executionResult: ExecutionResultDto): Promise<void> {
    const startTime = Date.now();
    const attemptId = executionResult.testId;
    this.logger.info("Triggered assessment evaluation integration", {
      attemptId,
      submissionId: executionResult.executionId,
    });

    try {
      // 1. Generate results DTO
      const resultDto = await this.resultGenerator.generateResult(executionResult);

      // 2. Persist the results, analytics, and run details
      const durationMs = Date.now() - startTime;
      await this.resultStorage.saveResult(resultDto, durationMs);

      this.logger.info("Evaluation integration finished successfully", {
        attemptId,
        durationMs,
      });
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error("Failed to run assessment evaluation integration", error);
      
      // Record failed run in the database
      await this.resultStorage.recordFailedRun(attemptId, errorMessage, durationMs);
      throw error;
    }
  }
}
