import {
  Controller,
  Sse,
  Param,
  UseGuards,
  MessageEvent,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Observable, timer, fromEvent, merge, map, filter, finalize } from "rxjs";
import { Redis } from "ioredis";
import { AppLogger } from "@intervu-ai/shared-logger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { REDIS_KEYS } from "../constants/monitoring.constants";

@ApiTags("Monitoring")
@Controller("admin/monitoring")
export class MonitoringSseController {
  private readonly logger = new AppLogger({ name: "MonitoringSseController" });

  @Sse("assessments/:id/live-stream")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth("jwt-auth")
  @ApiOperation({
    summary: "Real-time Server-Sent Events stream of assessment candidate telemetry and alerts",
  })
  streamAssessmentEvents(
    @Param("id") assessmentId: string,
    @Req() req: any,
  ): Observable<MessageEvent> {
    this.logger.info(`Admin client connected to live SSE stream for assessment: ${assessmentId}`);

    // Create a dedicated Redis subscriber client for this SSE stream connection
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    const sub = new Redis(redisUrl, {
      family: 4,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    sub.on("error", (err) => {
      this.logger.warn(`Redis SSE subscriber connection error for assessment ${assessmentId}`, err);
    });

    const isAll = assessmentId === "all";
    const channelName = isAll ? "assessment:*:events" : REDIS_KEYS.assessmentEventsChannel(assessmentId);

    if (isAll && typeof (sub as any).psubscribe === "function") {
      (sub as any).psubscribe(channelName, (err: any) => {
        if (err) {
          this.logger.error(`Failed psubscribing to Redis pattern ${channelName}`, err);
        } else {
          this.logger.debug(`Psubscribed to Redis pattern: ${channelName}`);
        }
      });
    } else {
      sub.subscribe(channelName, (err) => {
        if (err) {
          this.logger.error(`Failed subscribing to Redis channel ${channelName}`, err);
        } else {
          this.logger.debug(`Subscribed to Redis channel: ${channelName}`);
        }
      });
    }

    // 1. Observable from Redis Pub/Sub events (supports standard channel or pattern subscription)
    const messageEvents$ = fromEvent<[string, string]>(sub, "message").pipe(
      filter(([channel]) => isAll || channel === channelName),
      map(([, message]) => message),
    );

    const pmessageEvents$ = isAll
      ? fromEvent<[string, string, string]>(sub, "pmessage").pipe(
          map(([, , message]) => message),
        )
      : [];

    const redisEvents$ = merge(messageEvents$, pmessageEvents$).pipe(
      map((message) => {
        try {
          const parsed = JSON.parse(message);
          return {
            type: parsed.type,
            data: parsed,
          } as MessageEvent;
        } catch (e) {
          return {
            data: { raw: message },
          } as MessageEvent;
        }
      }),
    );

    // 2. Keep-alive ping interval (every 10s, starts immediately at t=0) to prevent QUIC/proxy idle timeouts
    const ping$ = timer(0, 10000).pipe(
      map(() => ({
        data: { type: "PING", serverTime: new Date().toISOString() },
        type: "PING",
      } as MessageEvent)),
    );

    // Clean up subscriber safely and idempotently on client close or stream finalize
    let isCleanedUp = false;
    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      this.logger.info(`Cleaning up Redis SSE subscriber for assessment: ${assessmentId}`);
      if (typeof sub.unsubscribe === "function") {
        try {
          const res = sub.unsubscribe(channelName);
          if (res && typeof (res as any).catch === "function") {
            (res as any).catch(() => {});
          }
        } catch {
          // ignore
        }
      }
      if (typeof sub.disconnect === "function") {
        try {
          sub.disconnect();
        } catch {
          // ignore
        }
      } else if (typeof (sub as any).quit === "function") {
        try {
          const res = (sub as any).quit();
          if (res && typeof (res as any).catch === "function") {
            (res as any).catch(() => {});
          }
        } catch {
          // ignore
        }
      }
    };

    req?.on?.("close", cleanup);

    return merge(redisEvents$, ping$).pipe(
      finalize(() => {
        cleanup();
      }),
    );
  }
}
