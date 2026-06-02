import { CreateTestRequestSchema } from '../schemas/api.schema';
import { z } from 'zod';

export class CreateTestRequestDto {
  companyId!: string;
  testType!: string;

  static validate(data: unknown): z.SafeParseReturnType<unknown, CreateTestRequestDto> {
    return CreateTestRequestSchema.safeParse(data);
  }
}
