import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { UpdateProfileSchema } from '@intervu/shared';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Updated name of the user profile',
  })
  name?: string;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, UpdateProfileDto> {
    return UpdateProfileSchema.safeParse(data) as unknown as z.SafeParseReturnType<
      unknown,
      UpdateProfileDto
    >;
  }
}
