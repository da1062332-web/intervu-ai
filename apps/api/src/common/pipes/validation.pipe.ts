import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ValidationPipe
  extends NestValidationPipe
  implements PipeTransform
{
  async transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      return value;
    }

    const { type, metatype } = metadata;

    if (type === 'custom' || !metatype) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object, {
      skipMissingProperties: false,
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const formattedErrors = errors.reduce(
        (acc, err) => {
          acc[err.property] = Object.values(err.constraints || {});
          return acc;
        },
        {} as Record<string, string[]>,
      );

      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    return object;
  }
}
