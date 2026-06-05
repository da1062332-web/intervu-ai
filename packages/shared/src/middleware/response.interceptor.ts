import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  /**
   * Wraps every successful response in the rule-book compliant envelope:
   * { success: true, data: T, error: null, meta: null }
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        // If data is already in the standard format (e.g., from an error filter or manually set), return it
        if (data && typeof data === "object" && "success" in data) {
          return data;
        }

        return {
          success: true,
          data: data,
          error: null,
          meta: null,
        };
      }),
    );
  }
}
