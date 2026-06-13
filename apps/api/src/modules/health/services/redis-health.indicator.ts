import { Injectable } from "@nestjs/common";
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from "@nestjs/terminus";
import { RedisConnectionManager } from "../../../cache";

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isConnected = RedisConnectionManager.isConnected();
    const result = this.getStatus(key, isConnected, {
      message: isConnected ? "Redis is connected" : "Redis is disconnected",
    });

    if (isConnected) {
      return result;
    }
    throw new HealthCheckError("Redischeck failed", result);
  }
}
