import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisConnectionManager } from "../../../cache/redis-connection.manager";

export interface ServiceHealthStatus {
  status: "healthy" | "unhealthy";
  responseTime?: number;
  error?: string;
}

export interface PlatformHealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  responseTime: number;
  services: {
    database: ServiceHealthStatus;
    redis: ServiceHealthStatus;
    queue: ServiceHealthStatus;
    aiProvider: ServiceHealthStatus;
  };
}

@Injectable()
export class PlatformHealthService {
  private readonly logger = new Logger(PlatformHealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<PlatformHealthResponse> {
    const startTime = Date.now();

    const [dbHealth, redisHealth, queueHealth, aiHealth] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
      this.checkQueueHealth(),
      this.checkAIProviderHealth(),
    ]);

    let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (dbHealth.status === "unhealthy") {
      overallStatus = "unhealthy";
    } else if (
      redisHealth.status === "unhealthy" ||
      queueHealth.status === "unhealthy" ||
      aiHealth.status === "unhealthy"
    ) {
      overallStatus = "degraded";
    }

    const responseTime = Date.now() - startTime;

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      uptime: process.uptime(),
      responseTime,
      services: {
        database: dbHealth,
        redis: redisHealth,
        queue: queueHealth,
        aiProvider: aiHealth,
      },
    };
  }

  private async checkDatabaseHealth(): Promise<ServiceHealthStatus> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "healthy", responseTime: Date.now() - start };
    } catch (error: unknown) {
      this.logger.error("Database health check failed", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      return { status: "unhealthy", error: errMsg };
    }
  }

  private async checkRedisHealth(): Promise<ServiceHealthStatus> {
    const start = Date.now();
    try {
      if (!RedisConnectionManager.isConnected()) {
        return { status: "unhealthy", error: "Redis not connected" };
      }
      const redis = RedisConnectionManager.getInstance();
      await redis.ping();
      return { status: "healthy", responseTime: Date.now() - start };
    } catch (error: unknown) {
      this.logger.error("Redis health check failed", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      return { status: "unhealthy", error: errMsg };
    }
  }

  private async checkQueueHealth(): Promise<ServiceHealthStatus> {
    const start = Date.now();
    try {
      if (!RedisConnectionManager.isConnected()) {
        return { status: "unhealthy", error: "BullMQ shared Redis is down" };
      }
      return { status: "healthy", responseTime: Date.now() - start };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return { status: "unhealthy", error: errMsg };
    }
  }

  private async checkAIProviderHealth(): Promise<ServiceHealthStatus> {
    const start = Date.now();
    try {
      const hasApiKey = !!process.env.OPENAI_API_KEY || !!process.env.GEMINI_API_KEY;
      if (!hasApiKey && process.env.NODE_ENV === "production") {
        return { status: "unhealthy", error: "AI Provider API keys are missing in production" };
      }
      return { status: "healthy", responseTime: Date.now() - start };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return { status: "unhealthy", error: errMsg };
    }
  }
}
