import { GenerateQuestionRequestSchema } from '../schemas/ai.schema';
import { DifficultyLevel } from '../enums/difficulty.enum';

export class GenerateQuestionRequestDto {
  topic!: string;
  difficulty!: DifficultyLevel;
  count!: number;

  static validate(data: unknown) {
    return GenerateQuestionRequestSchema.safeParse(data);
  }
}
