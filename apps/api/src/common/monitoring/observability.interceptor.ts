import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { AppLogger } from "@intervu-ai/shared-logger";

@Injectable()
export class ObservabilityInterceptor implements NestInterceptor {
  private readonly logger = new AppLogger({ name: "Observability" });

  // Very simplistic in-memory tracking (vendor-neutral)
  private static metrics = {
    request_count: 0,
    error_count: 0,
    active_requests: 0,
    http_status_distribution: {} as Record<number, number>,
    total_request_duration: 0,
  };

  public static getMetrics() {
    return {
      ...this.metrics,
      average_duration:
        this.metrics.request_count > 0
          ? this.metrics.total_request_duration / this.metrics.request_count
          : 0,
    };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const ctx = context.switchToHttp();
    const res = ctx.getResponse();

    ObservabilityInterceptor.metrics.active_requests++;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;

        ObservabilityInterceptor.metrics.active_requests--;
        ObservabilityInterceptor.metrics.request_count++;
        ObservabilityInterceptor.metrics.total_request_duration += duration;

        ObservabilityInterceptor.metrics.http_status_distribution[statusCode] =
          (ObservabilityInterceptor.metrics.http_status_distribution[
            statusCode
          ] || 0) + 1;

        // Optionally we could log these metrics to a system, but keeping them accessible via getMetrics() is fine for MVP.
      }),
      catchError((err) => {
        const duration = Date.now() - start;
        const statusCode = err.status || err.statusCode || 500;

        ObservabilityInterceptor.metrics.active_requests--;
        ObservabilityInterceptor.metrics.error_count++;
        ObservabilityInterceptor.metrics.request_count++;
        ObservabilityInterceptor.metrics.total_request_duration += duration;

        ObservabilityInterceptor.metrics.http_status_distribution[statusCode] =
          (ObservabilityInterceptor.metrics.http_status_distribution[
            statusCode
          ] || 0) + 1;

        return throwError(() => err);
      }),
    );
  }
}
