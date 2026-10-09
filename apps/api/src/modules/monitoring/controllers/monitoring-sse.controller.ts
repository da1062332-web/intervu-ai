import {
  Controller,
  Sse,
  Param,
  UseGuards,
  MessageEvent,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { Observable, timer, merge, map, filter, finalize } from "rxjs";
import { AppLogger } from "@intervu-ai/shared-logger";
import { Public } from "../../auth/decorators/public.decorator";
import { StreamTicketGuard } from "../guards/stream-ticket.guard";
import { MonitoringEventBusService } from "../services/monitoring-event-bus.service";
import { REDIS_KEYS } from "../constants/monitoring.constants";

@ApiTags("Monitoring")
@Controller("admin/monitoring")
export class MonitoringSseController {
  private readonly logger = new AppLogger({ name: "MonitoringSseController" });

  constructor(private readonly eventBus: MonitoringEventBusService) {}

  // EventSource cannot send an Authorization header, so this route skips the global
  // JWT guard and authenticates with a single-use ticket from POST stream-ticket.
  @Sse("assessments/:id/live-stream")
  @Public()
  @UseGuards(StreamTicketGuard)
  @ApiQuery({ name: "ticket", description: "Single-use ticket from POST /admin/monitoring/stream-ticket" })
  @ApiOperation({
    summary: "Real-time Server-Sent Events stream of assessment candidate telemetry and alerts",
  })
  streamAssessmentEvents(@Param("id") assessmentId: string): Observable<MessageEvent> {
    this.logger.info(`Admin client connected to live SSE stream for assessment: ${assessmentId}`);

    const isAll = assessmentId === "all";
    const channelName = REDIS_KEYS.assessmentEventsChannel(assessmentId);

    // 1. Shared Redis Pub/Sub feed, narrowed to this assessment's channel
    const redisEvents$ = this.eventBus.stream().pipe(
      filter(({ channel }) => isAll || channel === channelName),
      map(({ message }) => {
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

    // Nest unsubscribes this observable when the client disconnects
    return merge(redisEvents$, ping$).pipe(
      finalize(() => {
        this.logger.info(`Admin client disconnected from live SSE stream for assessment: ${assessmentId}`);
      }),
    );
  }
}
