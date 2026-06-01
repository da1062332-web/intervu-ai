import { GenerateQuestionRequestSchema } from '../schemas/ai.schema';
import { Difficulty } from '../enums/difficulty.enum';
import { z } from 'zod';

export class GenerateQuestionRequestDto {
  topic!: string;
  difficulty!: Difficulty;
  count!: number;

  static validate(data: unknown): z.SafeParseReturnType<unknown, GenerateQuestionRequestDto> {
    return GenerateQuestionRequestSchema.safeParse(data);
  }
}
