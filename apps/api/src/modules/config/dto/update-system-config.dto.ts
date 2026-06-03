import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  DifficultyConfig,
  GenerationConfig,
  ValidationConfig,
  QueueConfig,
  EnvironmentFlags,
  DifficultyConfigSchema,
  GenerationConfigSchema,
  ValidationConfigSchema,
  QueueConfigSchema,
  EnvironmentFlagsSchema
} from './system-config.dto';

export const UpdateSystemConfigSchema = z.object({
  difficultyLevels: z.array(DifficultyConfigSchema.partial()).optional(),
  generationRules: GenerationConfigSchema.partial().optional(),
  validationRules: ValidationConfigSchema.partial().optional(),
  queueSettings: QueueConfigSchema.partial().optional(),
  environmentFlags: EnvironmentFlagsSchema.partial().optional(),
});

export class UpdateSystemConfigDto {
  @ApiPropertyOptional({ type: [DifficultyConfig], description: 'Configured difficulty levels' })
  difficultyLevels?: Partial<DifficultyConfig>[];

  @ApiPropertyOptional({ type: GenerationConfig, description: 'LLM generation rules' })
  generationRules?: Partial<GenerationConfig>;

  @ApiPropertyOptional({ type: ValidationConfig, description: 'Input/output validation rules' })
  validationRules?: Partial<ValidationConfig>;

  @ApiPropertyOptional({ type: QueueConfig, description: 'Queue background processing parameters' })
  queueSettings?: Partial<QueueConfig>;

  @ApiPropertyOptional({ type: EnvironmentFlags, description: 'Global environment configuration toggles' })
  environmentFlags?: Partial<EnvironmentFlags>;

  static validate(data: unknown): z.SafeParseReturnType<unknown, UpdateSystemConfigDto> {
    return UpdateSystemConfigSchema.safeParse(data) as unknown as z.SafeParseReturnType<unknown, UpdateSystemConfigDto>;
  }
}
