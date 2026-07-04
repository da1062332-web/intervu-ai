import { Injectable, Logger } from "@nestjs/common";
import { RuntimeRepository } from "../repositories/runtime.repository";

@Injectable()
export class RuntimeMonitoringService {
  private readonly logger = new Logger(RuntimeMonitoringService.name);

  constructor(private readonly runtimeRepository: RuntimeRepository) {}

  async trackBuildStarted(testId: string): Promise<void> {
    await this.runtimeRepository.createBuild(testId, "STARTED", 0);
  }

  async trackBuildCompleted(testId: string, durationMs: number): Promise<void> {
    await this.runtimeRepository.updateBuild(testId, "COMPLETED", durationMs);
    await this.recordMetric(testId, "generation_time", durationMs);
  }

  async trackBuildFailed(
    testId: string,
    error: string,
    durationMs: number,
  ): Promise<void> {
    await this.runtimeRepository.updateBuild(testId, "FAILED", durationMs, {
      error,
    });
  }

  async trackValidationPassed(
    testId: string,
    durationMs: number,
  ): Promise<void> {
    await this.runtimeRepository.logValidation(testId, true);
    await this.recordMetric(testId, "validation_time", durationMs);
  }

  async trackValidationFailed(
    testId: string,
    errors: string[] = [],
    durationMs: number,
  ): Promise<void> {
    await this.runtimeRepository.logValidation(testId, false, errors);
    await this.recordMetric(testId, "validation_time", durationMs);
  }

  async trackLoadTime(testId: string, loadTimeMs: number): Promise<void> {
    await this.recordMetric(testId, "load_time", loadTimeMs);
  }

  private async recordMetric(
    testId: string,
    metricName: string,
    value: number,
  ): Promise<void> {
    await this.runtimeRepository.createMetric(testId, metricName, value);
  }
}
