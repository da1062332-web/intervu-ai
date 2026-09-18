import { Injectable } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisConnectionManager } from "../../../cache/redis-connection.manager";
import {
  AlertSeverity,
  AlertCategory,
  REDIS_KEYS,
  MONITORING_CONFIG,
} from "../constants/monitoring.constants";

export interface LiveAlertPayload {
  assessmentId: string;
  attemptId?: string;
  candidateId?: string;
  candidateName?: string;
  candidateRole?: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  metadata?: any;
}

@Injectable()
export class LiveAlertService {
  private readonly logger = new AppLogger({ name: "LiveAlertService" });
  private readonly recentAlertCooldown = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  private isRedisAvailable(): boolean {
    return RedisConnectionManager.isConnected();
  }

  async emitAlert(alert: LiveAlertPayload): Promise<any> {
    // Strictly do not emit alerts for ADMIN or PLAN_MANAGER users
    if (alert.candidateRole === "ADMIN" || alert.candidateRole === "PLAN_MANAGER") {
      return null;
    }

    if (alert.candidateId && !alert.candidateRole) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: alert.candidateId },
          select: { role: true },
        });
        if (user?.role === "ADMIN" || user?.role === "PLAN_MANAGER") {
          return null;
        }
      } catch (_) {}
    }

    const dedupeKey = `${alert.assessmentId}:${alert.attemptId || "global"}:${alert.category}:${alert.severity}`;
    const now = Date.now();
    const lastEmitted = this.recentAlertCooldown.get(dedupeKey);

    // Cooldown: Avoid duplicate alerts within 30 seconds
    if (lastEmitted && now - lastEmitted < 30000) {
      return null;
    }
    this.recentAlertCooldown.set(dedupeKey, now);

    this.logger.warn(`[ALERT ${alert.severity}] [${alert.category}] ${alert.title}: ${alert.message}`, {
      assessmentId: alert.assessmentId,
      attemptId: alert.attemptId,
      severity: alert.severity,
    });

    let dbAlert: any = null;
    try {
      dbAlert = await this.prisma.liveAssessmentAlert.create({
        data: {
          assessmentId: alert.assessmentId,
          attemptId: alert.attemptId,
          candidateId: alert.candidateId,
          severity: alert.severity,
          category: alert.category,
          title: alert.title,
          message: alert.message,
          metadata: alert.metadata,
        },
      });
    } catch (err: any) {
      this.logger.error("Failed to persist alert in database", err, { alert });
    }

    const alertEvent = {
      id: dbAlert?.id || `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      assessmentId: alert.assessmentId,
      attemptId: alert.attemptId,
      candidateId: alert.candidateId,
      candidateName: alert.candidateName,
      severity: alert.severity,
      category: alert.category,
      title: alert.title,
      message: alert.message,
      metadata: alert.metadata,
      createdAt: new Date().toISOString(),
      isResolved: false,
    };

    if (this.isRedisAvailable()) {
      try {
        const redis = RedisConnectionManager.getInstance();
        const listKey = REDIS_KEYS.assessmentAlertsList(alert.assessmentId);
        await redis.lpush(listKey, JSON.stringify(alertEvent));
        await redis.ltrim(listKey, 0, 99); // Keep last 100 alerts in Redis
        await redis.expire(listKey, MONITORING_CONFIG.REDIS_ALERT_TTL_SECONDS);

        // Broadcast alert event over SSE Pub/Sub
        await redis.publish(
          REDIS_KEYS.assessmentEventsChannel(alert.assessmentId),
          JSON.stringify({
            type: "ALERT_EMITTED",
            payload: alertEvent,
            timestamp: new Date().toISOString(),
          }),
        );
      } catch (redisErr) {
        this.logger.warn("Failed to publish alert to Redis", { error: redisErr });
      }
    }

    return alertEvent;
  }

  async getActiveAlerts(assessmentId: string): Promise<any[]> {
    if (this.isRedisAvailable()) {
      try {
        const redis = RedisConnectionManager.getInstance();
        const listKey = REDIS_KEYS.assessmentAlertsList(assessmentId);
        const rawAlerts = await redis.lrange(listKey, 0, 49);
        if (rawAlerts && rawAlerts.length > 0) {
          return rawAlerts
            .map((r) => {
              try {
                return JSON.parse(r);
              } catch {
                return null;
              }
            })
            .filter((a) => a && !a.isResolved && a.candidateRole !== "ADMIN" && a.candidateRole !== "PLAN_MANAGER");
        }
      } catch (err) {
        this.logger.warn("Failed reading alerts from Redis, falling back to DB", { error: err });
      }
    }

    try {
      const whereClause: any = { isResolved: false };
      if (assessmentId !== "all") {
        whereClause.assessmentId = assessmentId;
      }
      const dbAlerts = await this.prisma.liveAssessmentAlert.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const candidateIds = dbAlerts
        .map((a) => a.candidateId)
        .filter((cid): cid is string => Boolean(cid));

      if (candidateIds.length > 0) {
        const adminUsers = await this.prisma.user.findMany({
          where: {
            id: { in: candidateIds },
            role: { in: ["ADMIN", "PLAN_MANAGER"] },
          },
          select: { id: true },
        });
        const adminIdSet = new Set(adminUsers.map((u) => u.id));
        return dbAlerts.filter((a) => !a.candidateId || !adminIdSet.has(a.candidateId));
      }

      return dbAlerts;
    } catch (err) {
      this.logger.error("Failed reading alerts from DB", err);
      return [];
    }
  }

  async resolveAlert(alertId: string, resolvedBy: string, notes?: string): Promise<boolean> {
    try {
      const updated = await this.prisma.liveAssessmentAlert.update({
        where: { id: alertId },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy,
          metadata: notes ? { resolutionNotes: notes } : undefined,
        },
      });

      if (this.isRedisAvailable() && updated) {
        const redis = RedisConnectionManager.getInstance();
        const listKey = REDIS_KEYS.assessmentAlertsList(updated.assessmentId);

        try {
          const rawAlerts = await redis.lrange(listKey, 0, -1);
          if (rawAlerts && rawAlerts.length > 0) {
            const remaining = rawAlerts
              .map((r) => {
                try {
                  return JSON.parse(r);
                } catch {
                  return null;
                }
              })
              .filter((a) => a && a.id !== alertId && !a.isResolved);

            await redis.del(listKey);
            if (remaining.length > 0) {
              const serialized = remaining.reverse().map((a) => JSON.stringify(a));
              await redis.lpush(listKey, ...serialized);
              await redis.expire(listKey, MONITORING_CONFIG.REDIS_ALERT_TTL_SECONDS);
            }
          }
        } catch (redisErr) {
          this.logger.warn("Failed synchronizing resolved alert in Redis list", { error: redisErr });
        }

        await redis.publish(
          REDIS_KEYS.assessmentEventsChannel(updated.assessmentId),
          JSON.stringify({
            type: "ALERT_RESOLVED",
            payload: { alertId, resolvedBy, resolvedAt: new Date().toISOString() },
            timestamp: new Date().toISOString(),
          }),
        );
      }

      return true;
    } catch (err: any) {
      this.logger.error("Failed to resolve alert", err, { alertId });
      return false;
    }
  }
}
