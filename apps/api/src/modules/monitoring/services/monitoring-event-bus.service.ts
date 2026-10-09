import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Observable, Subject } from "rxjs";
import { Redis } from "ioredis";
import { AppLogger } from "@intervu-ai/shared-logger";

const ASSESSMENT_EVENTS_PATTERN = "assessment:*:events";

export interface AssessmentChannelMessage {
  channel: string;
  message: string;
}

/**
 * One Redis pub/sub subscriber per API instance, shared by every live SSE stream.
 *
 * Previously each SSE connection opened its own Redis client, so admin tabs and
 * EventSource reconnect loops multiplied Redis connections — exactly when the API
 * was already under pressure. Streams now filter this shared feed by channel.
 */
@Injectable()
export class MonitoringEventBusService implements OnModuleDestroy {
  private readonly logger = new AppLogger({ name: "MonitoringEventBusService" });
  private readonly events$ = new Subject<AssessmentChannelMessage>();
  private subscriber: Redis | null = null;

  /** Messages published on any `assessment:*:events` channel. */
  stream(): Observable<AssessmentChannelMessage> {
    this.ensureSubscribed();
    return this.events$.asObservable();
  }

  onModuleDestroy(): void {
    if (this.subscriber) {
      try {
        this.subscriber.disconnect();
      } catch {
        // ignore
      }
      this.subscriber = null;
    }
    this.events$.complete();
  }

  private ensureSubscribed(): void {
    if (this.subscriber) return;

    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    const sub = new Redis(redisUrl, {
      family: 4,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    sub.on("error", (err) => {
      this.logger.warn("Redis monitoring subscriber connection error", err);
    });

    sub.on("pmessage", (_pattern: string, channel: string, message: string) => {
      this.events$.next({ channel, message });
    });

    sub.psubscribe(ASSESSMENT_EVENTS_PATTERN, (err) => {
      if (err) {
        this.logger.error(`Failed psubscribing to Redis pattern ${ASSESSMENT_EVENTS_PATTERN}`, err);
      } else {
        this.logger.debug(`Psubscribed to Redis pattern: ${ASSESSMENT_EVENTS_PATTERN}`);
      }
    });

    this.subscriber = sub;
  }
}
