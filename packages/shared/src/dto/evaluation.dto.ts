import { z } from 'zod';

export const EvaluationRequestSchema = z.object({
  answerId: z.string().min(1),
  candidateResponse: z.string().min(1),
});

export class EvaluationRequestDto {
  answerId!: string;
  candidateResponse!: string;

  static validate(data: unknown): z.SafeParseReturnType<unknown, EvaluationRequestDto> {
    return EvaluationRequestSchema.safeParse(data);
  }
}
