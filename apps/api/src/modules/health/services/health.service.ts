import { Injectable } from '@nestjs/common';
import { RedisConnectionManager } from '@/cache/redis-connection.manager';

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'unhealthy';
  service: string;
  timestamp: string;
  version: string;
  uptime: number;
  dependencies?: {
    redis?: ServiceHealth;
    database?: ServiceHealth;
  };
}

@Injectable()
export class HealthService {
  async getHealth(): Promise<HealthResponse> {
    const redisHealth = await this.checkRedisHealth();

    const overallStatus =
      redisHealth.status === 'unhealthy' ? 'degraded' : 'ok';

    return {
      status: overallStatus as any,
      service: 'intervu-api',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      dependencies: {
        redis: redisHealth,
      },
    };
  }

  private async checkRedisHealth(): Promise<ServiceHealth> {
    try {
      const startTime = Date.now();

      if (!RedisConnectionManager.isConnected()) {
        return {
          status: 'unhealthy',
          error: 'Redis not connected',
        };
      }

      const redis = RedisConnectionManager.getInstance();
      await redis.ping();

      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
