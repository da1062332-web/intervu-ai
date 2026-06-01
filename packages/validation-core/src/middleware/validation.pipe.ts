import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';
import { formatZodError } from '../utils/validation.utils';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema?: ZodSchema<any>) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body' && metadata.type !== 'query' && metadata.type !== 'param') {
      return value;
    }

    try {
      let parsedValue = value;
      
      if (this.schema) {
        parsedValue = this.schema.parse(value);
      } else if (metadata.metatype && (metadata.metatype as any).validate) {
        const result = (metadata.metatype as any).validate(value);
        if (!result.success) {
          throw result.error; // Will be caught below as ZodError
        }
        parsedValue = result.data;
      }
      
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = formatZodError(error);
        throw new BadRequestException({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid payload',
            details: issues
          }
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
