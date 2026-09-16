import { Injectable, Optional } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisConnectionManager } from "../../../cache/redis-connection.manager";
import { QueueService } from "../../../queue/queue.service";
import { LiveAlertService } from "./live-alert.service";
import { MONITORING_CONFIG, REDIS_KEYS } from "../constants/monitoring.constants";

export interface SystemHealthMetrics {
  timestamp: string;
  status: "HEALTHY" | "DEGRADED" | "CRITICAL";
  api: {
    uptimeSeconds: number;
    memoryUsageMb: number;
    heapUsedMb: number;
    nodeEnv: string;
  };
  database: {
    status: "HEALTHY" | "UNHEALTHY";
    latencyMs: number;
  };
  redis: {
    status: "HEALTHY" | "UNHEALTHY" | "DEGRADED";
    connectedClients?: number;
    usedMemoryHuman?: string;
  };
  queues: {
    status: "HEALTHY" | "DEGRADED";
    metrics: Record<string, any>;
  };
  sse: {
    connectedAssessments: number;
  };
  activeIncidents: any[];
}

@Injectable()
export class SystemHealthService {
  private readonly logger = new AppLogger({ name: "SystemHealthService" });

  private cachedHealth: SystemHealthMetrics | null = null;
  private lastHealthCheckAt = 0;
  private smoothedDbLatency = 0;
  private readonly CACHE_TTL_MS = 15000; // 15 seconds cache to avoid blocking snapshot requests

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertService: LiveAlertService,
    @Optional() private readonly queueService?: QueueService,
  ) {}

  private isRedisAvailable(): boolean {
    return RedisConnectionManager.isConnected();
  }

  async getPlatformHealth(): Promise<SystemHealthMetrics> {
    const now = Date.now();
    if (this.cachedHealth && now - this.lastHealthCheckAt < this.CACHE_TTL_MS) {
      return this.cachedHealth;
    }

    let dbStatus: "HEALTHY" | "UNHEALTHY" = "HEALTHY";
    let dbLatency = 0;

    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
      this.smoothedDbLatency =
        this.smoothedDbLatency === 0
          ? dbLatency
          : Math.round(this.smoothedDbLatency * 0.7 + dbLatency * 0.3);
    } catch (err) {
      dbStatus = "UNHEALTHY";
      this.logger.error("DB health check failed", err);
    }

    let redisStatus: "HEALTHY" | "UNHEALTHY" | "DEGRADED" = "HEALTHY";
    let redisInfo: any = {};
    if (this.isRedisAvailable()) {
      try {
        const redis = RedisConnectionManager.getInstance();
        const rawInfo = await redis.info("clients");
        redisInfo.raw = rawInfo;
      } catch (err) {
        redisStatus = "DEGRADED";
      }
    } else {
      redisStatus = "UNHEALTHY";
    }

    let queueMetrics = {};
    let queueStatus: "HEALTHY" | "DEGRADED" = "HEALTHY";
    if (this.queueService) {
      try {
        queueMetrics = await this.queueService.getQueueMetrics();
      } catch (err) {
        queueStatus = "DEGRADED";
      }
    }

    const mem = process.memoryUsage();
    // Default threshold is 2500ms to accommodate remote cloud database connections (e.g. cross-continental Supabase/AWS)
    const dbDegradedThreshold = parseInt(
      process.env.DB_LATENCY_DEGRADED_THRESHOLD_MS || "2500",
      10,
    );
    const overallStatus =
      dbStatus === "UNHEALTHY" || redisStatus === "UNHEALTHY"
        ? "CRITICAL"
        : this.smoothedDbLatency > dbDegradedThreshold || queueStatus === "DEGRADED"
          ? "DEGRADED"
          : "HEALTHY";

    const result: SystemHealthMetrics = {
      timestamp: new Date().toISOString(),
      status: overallStatus,
      api: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        nodeEnv: process.env.NODE_ENV || "development",
      },
      database: {
        status: dbStatus,
        latencyMs: this.smoothedDbLatency,
      },
      redis: {
        status: redisStatus,
      },
      queues: {
        status: queueStatus,
        metrics: queueMetrics,
      },
      sse: {
        connectedAssessments: 0,
      },
      activeIncidents: [],
    };

    this.cachedHealth = result;
    this.lastHealthCheckAt = now;
    return result;
  }

  /**
   * Tracks mass disconnect events in a 60s sliding window.
   * If >= 10% of active candidates disconnect, fires a P0 Platform Incident alert.
   */
  async trackCandidateDisconnect(assessmentId: string, totalActiveCandidates: number): Promise<void> {
    if (!this.isRedisAvailable() || totalActiveCandidates < 10) {
      return;
    }

    try {
      const redis = RedisConnectionManager.getInstance();
      const stormKey = REDIS_KEYS.assessmentStormTracker(assessmentId);
      const now = Date.now();

      // Add timestamp to sorted set
      await redis.zadd(stormKey, now, `${now}-${Math.random()}`);
      // Remove events older than 60 seconds
      await redis.zremrangebyscore(stormKey, 0, now - 60000);
      await redis.expire(stormKey, 120);

      const disconnectsLastMinute = await redis.zcard(stormKey);
      const threshold = Math.ceil(
        totalActiveCandidates * MONITORING_CONFIG.ASSESSMENT_STORM_DISCONNECT_PERCENT,
      );

      if (disconnectsLastMinute >= threshold) {
        await this.alertService.emitAlert({
          assessmentId,
          severity: "P0",
          category: "PLATFORM",
          title: "Assessment Network Storm / Mass Disconnect Detected",
          message: `${disconnectsLastMinute} candidates disconnected within the last 60 seconds (${Math.round((disconnectsLastMinute / totalActiveCandidates) * 100)}% of active candidates). Possible platform network incident.`,
          metadata: {
            disconnectsLastMinute,
            totalActiveCandidates,
            threshold,
          },
        });
      }
    } catch (err) {
      this.logger.warn("Failed tracking disconnect storm in Redis", { error: err });
    }
  }
}
