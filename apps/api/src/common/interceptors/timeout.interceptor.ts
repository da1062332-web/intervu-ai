import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from "@nestjs/common";
import { Observable, throwError, TimeoutError } from "rxjs";
import { catchError, timeout } from "rxjs/operators";

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly defaultTimeoutMs: number;

  constructor(timeoutMs?: number) {
    this.defaultTimeoutMs =
      timeoutMs ||
      parseInt(process.env.HTTP_REQUEST_TIMEOUT_MS || "300000", 10);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const url = req?.url || "";

    // Allow extended timeout (900s / 15 mins) for heavy generation, evaluation, validation, execution sync, and pool refill operations
    const isHeavyOperation =
      url.includes("/system/") ||
      url.includes("/assembly/") ||
      url.includes("/blueprint/") ||
      url.includes("/evaluations/") ||
      url.includes("/generation") ||
      url.includes("/reports/") ||
      url.includes("/tests/") ||
      url.includes("/coding/") ||
      url.includes("/execution/") ||
      url.includes("/submissions/");

    const timeoutDuration = isHeavyOperation
      ? Math.max(this.defaultTimeoutMs, 900000)
      : this.defaultTimeoutMs;

    return next.handle().pipe(
      timeout(timeoutDuration),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new RequestTimeoutException(
                `Request to ${req?.method || "HTTP"} ${req?.url || ""} timed out after ${timeoutDuration}ms`,
              ),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
