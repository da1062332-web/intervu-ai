import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from "class-validator";

export class GenerationRequestDto {
  @IsString()
  @IsNotEmpty()
  examId!: string;

  @IsString()
  @IsOptional()
  sectionId?: string;

  @IsNumber()
  @Min(1)
  count!: number;
}

export class SectionDto {
  id!: string;
  name!: string;
  questionCount!: number;
  durationMinutes!: number;
  orderIndex!: number;
  code!: string;
}

export class TopicDto {
  id!: string;
  name!: string;
  code!: string;
  conceptCodes!: string[];
  weightagePercentage?: number;
}

export class TemplateDto {
  id!: string;
  templateKey!: string;
  conceptKey!: string;
  difficultyLevel!: string;
  questionType!: string;
  version!: number;
  isActive!: boolean;
  variableSchema?: any;
  constraints?: any;
  solutionSchema?: any;
}

export class GenerationContextDto {
  examId!: string;
  sections!: SectionDto[];
  topics!: TopicDto[];
  templates!: TemplateDto[];
  difficultyDistribution!: any;
}

export class TemplateSelectionRequest {
  topicId!: string;
  difficulty!: string;
  questionType!: string;
}

export class SelectedTemplate {
  templateId!: string;
  version!: number;
  metadata!: any;
}

export class ValidationResult {
  isValid!: boolean;
  errors!: string[];
}

export class GenerationResponseDto {
  success!: boolean;
  generated!: number;
  failed!: number;
}

export class ApiResponseDto<T = any> {
  success!: boolean;
  data!: T | null;
  error!: {
    code: string;
    message: string;
    details?: any[];
  } | null;
  meta!: {
    timestamp: string;
    [key: string]: any;
  };
}
