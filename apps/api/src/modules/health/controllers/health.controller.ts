import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiOkResponse } from "@nestjs/swagger";
import { ValidateResponse, HealthResponseSchema } from "@intervu/shared";
import {
  HealthCheckService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from "@nestjs/terminus";
import { PrismaService } from "../../../prisma/prisma.service";
import { Public } from "../../auth/decorators/public.decorator";
import { RedisHealthIndicator } from "../services/redis-health.indicator";
import { ObservabilityInterceptor } from "../../../common/monitoring/observability.interceptor";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly memoryHealth: MemoryHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Public()
  @ValidateResponse(HealthResponseSchema)
  @ApiOperation({
    summary: "Liveness check endpoint",
    description:
      "Returns basic health status of the API service. Does not check dependencies.",
  })
  @ApiOkResponse({ description: "Service is alive" })
  checkLiveness() {
    return {
      status: "ok",
      service: "intervu-api",
      version: "1.0.0",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get("ready")
  @Public()
  @ApiOperation({
    summary: "Readiness check endpoint",
    description:
      "Returns the detailed health status of the API service and its dependencies",
  })
  @ApiOkResponse({ description: "Service is ready" })
  checkReadiness() {
    return this.health.check([
      // The process should not use more than 1GB memory
      () => this.memoryHealth.checkHeap("memory_heap", 1024 * 1024 * 1024),
      () => this.memoryHealth.checkRSS("memory_rss", 1024 * 1024 * 1024),
      // Database check
      () => this.prismaHealth.pingCheck("database", this.prisma),
      // Redis check
      () => this.redisHealth.isHealthy("redis"),
    ]);
  }

  @Get("metrics")
  @Public()
  @ApiOperation({
    summary: "Observability metrics",
    description: "Returns request counts, durations, and error rates.",
  })
  getMetrics() {
    return ObservabilityInterceptor.getMetrics();
  }
}
