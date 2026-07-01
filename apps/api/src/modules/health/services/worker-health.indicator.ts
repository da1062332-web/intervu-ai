import { Injectable } from "@nestjs/common";
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from "@nestjs/terminus";

@Injectable()
export class WorkerHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isInitialized = (global as any).isWorkerInitialized === true;
    const result = this.getStatus(key, isInitialized, {
      message: isInitialized ? "Worker is initialized" : "Worker is not initialized",
    });

    if (isInitialized) {
      return result;
    }
    throw new HealthCheckError("Worker check failed", result);
  }
}
