import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ZodSchema } from 'zod';
import { validateResponse } from '../validators/validate-response';

@Injectable()
export class ResponseValidationInterceptor implements NestInterceptor {
  constructor(private schema: ZodSchema<unknown>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map(data => {
        // We only validate the actual data payload before it gets wrapped by ResponseInterceptor
        // If data is already wrapped in success: true, we extract data to validate
        let payloadToValidate = data;
        let isWrapped = false;
        
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          payloadToValidate = data.data;
          isWrapped = true;
        }

        const validatedPayload = validateResponse(this.schema, payloadToValidate);
        
        if (isWrapped) {
          return { ...data, data: validatedPayload };
        }
        
        return validatedPayload;
      }),
    );
  }
}
