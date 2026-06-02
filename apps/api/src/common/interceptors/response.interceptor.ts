import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: any;
  meta?: {
    timestamp: string;
    path: string;
  };
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        error: null,
        meta: {
          timestamp: new Date().toISOString(),
          path: `${method} ${url}`,
        },
      })),
    );
  }
}
