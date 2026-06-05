import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";

export class DifficultyConfig {
  @ApiProperty({ example: "easy", description: "Difficulty level identifier" })
  id!: string;

  @ApiProperty({ example: "Easy", description: "Display name" })
  name!: string;

  @ApiProperty({ example: 60, description: "Time limit in seconds" })
  timeLimitSeconds!: number;

  @ApiProperty({ example: 1.0, description: "Weight factor" })
  weight!: number;

  @ApiProperty({ example: true, description: "Whether active" })
  isActive!: boolean;

  @ApiProperty({ example: 60, description: "Minimum passing score" })
  passingScore!: number;
}

export class GenerationConfig {
  @ApiProperty({ example: "gpt-4", description: "Default AI Model" })
  defaultModel!: string;

  @ApiProperty({ example: 0.7, description: "Default generation temperature" })
  temperature!: number;

  @ApiProperty({ example: 1000, description: "Maximum tokens to generate" })
  maxTokens!: number;

  @ApiProperty({
    example: { easy: 0.5, medium: 0.7, hard: 0.9 },
    description: "Temperature presets per difficulty",
  })
  temperaturePresets!: Record<string, number>;

  @ApiProperty({ example: 3, description: "Retry count on failures" })
  retryCount!: number;
}

export class ValidationConfig {
  @ApiProperty({ example: true, description: "Enable strict validation" })
  strictMode!: boolean;

  @ApiProperty({
    example: 5,
    description: "Maximum validation error threshold",
  })
  maxValidationErrors!: number;

  @ApiProperty({
    example: ["multiple-choice", "coding", "free-text"],
    description: "Supported question types",
  })
  allowedTypes!: string[];

  @ApiProperty({
    example: false,
    description: "Allow undocumented/unknown properties",
  })
  allowUnknownFields!: boolean;
}

export class QueueConfig {
  @ApiProperty({
    example: { generation: 5, evaluation: 2, analytics: 10 },
    description: "Concurrency count by queue name",
  })
  concurrency!: Record<string, number>;

  @ApiProperty({
    example: 30000,
    description: "Job execution timeout in milliseconds",
  })
  jobTimeoutMs!: number;

  @ApiProperty({ example: 3, description: "Maximum job attempts" })
  maxAttempts!: number;

  @ApiProperty({ example: 5000, description: "Backoff delay in milliseconds" })
  backoffDelayMs!: number;
}

export class EnvironmentFlags {
  @ApiProperty({
    example: false,
    description: "System-wide maintenance mode flag",
  })
  maintenanceMode!: boolean;

  @ApiProperty({
    example: true,
    description: "Enable background processing worker",
  })
  enableWorker!: boolean;

  @ApiProperty({ example: false, description: "Enable debugging logs" })
  debugMode!: boolean;

  @ApiProperty({ example: true, description: "Enable Redis caching" })
  enableCaching!: boolean;
}

export class SystemConfigDto {
  @ApiProperty({
    type: [DifficultyConfig],
    description: "Configured difficulty levels",
  })
  difficultyLevels!: DifficultyConfig[];

  @ApiProperty({ type: GenerationConfig, description: "LLM generation rules" })
  generationRules!: GenerationConfig;

  @ApiProperty({
    type: ValidationConfig,
    description: "Input/output validation rules",
  })
  validationRules!: ValidationConfig;

  @ApiProperty({
    type: QueueConfig,
    description: "Queue background processing parameters",
  })
  queueSettings!: QueueConfig;

  @ApiProperty({
    type: EnvironmentFlags,
    description: "Global environment configuration toggles",
  })
  environmentFlags!: EnvironmentFlags;
}

export const DifficultyConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  timeLimitSeconds: z.number().int().positive(),
  weight: z.number().positive(),
  isActive: z.boolean(),
  passingScore: z.number().min(0).max(100),
});

export const GenerationConfigSchema = z.object({
  defaultModel: z.string().min(1),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().positive(),
  temperaturePresets: z.record(z.string(), z.number()),
  retryCount: z.number().int().nonnegative(),
});

export const ValidationConfigSchema = z.object({
  strictMode: z.boolean(),
  maxValidationErrors: z.number().int().positive(),
  allowedTypes: z.array(z.string()),
  allowUnknownFields: z.boolean(),
});

export const QueueConfigSchema = z.object({
  concurrency: z.record(z.string(), z.number().int().positive()),
  jobTimeoutMs: z.number().int().positive(),
  maxAttempts: z.number().int().positive(),
  backoffDelayMs: z.number().int().positive(),
});

export const EnvironmentFlagsSchema = z.object({
  maintenanceMode: z.boolean(),
  enableWorker: z.boolean(),
  debugMode: z.boolean(),
  enableCaching: z.boolean(),
});

export const SystemConfigSchema = z.object({
  difficultyLevels: z.array(DifficultyConfigSchema),
  generationRules: GenerationConfigSchema,
  validationRules: ValidationConfigSchema,
  queueSettings: QueueConfigSchema,
  environmentFlags: EnvironmentFlagsSchema,
});
