import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const EvaluationRequestSchema = z.object({
  answerId: z.string().min(1),
  candidateResponse: z.string().min(1),
});

export class EvaluationRequestDto {
  @ApiProperty({ example: 'ans_987654', description: 'Identifier of the answer sheet question' })
  answerId!: string;

  @ApiProperty({ example: 'Closures are functions that reference outer variables...', description: 'The text response submitted by the candidate' })
  candidateResponse!: string;

  static validate(data: unknown): z.SafeParseReturnType<unknown, EvaluationRequestDto> {
    return EvaluationRequestSchema.safeParse(data);
  }
}
