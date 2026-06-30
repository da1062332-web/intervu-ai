import { IsString, IsNotEmpty, IsEnum, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { WorkflowStep, WorkflowStatus } from "@prisma/client";

export class CreateWorkflowDto {
  @ApiProperty({
    description: "The ID of the exam configuration to start a workflow for",
  })
  @IsString()
  @IsNotEmpty()
  examId!: string;
}

export class RollbackDto {
  @ApiPropertyOptional({ description: "Optional reason for rollback" })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class RetryWorkflowDto {
  @ApiProperty({ enum: WorkflowStep, description: "The step to retry" })
  @IsEnum(WorkflowStep)
  @IsNotEmpty()
  step!: WorkflowStep;
}

export class BulkWorkflowDto {
  @ApiProperty({ type: [String], description: "List of exam IDs to process" })
  @IsString({ each: true })
  @IsNotEmpty()
  examIds!: string[];

  @ApiPropertyOptional({
    enum: WorkflowStep,
    description: "Only needed if action is retry",
  })
  @IsEnum(WorkflowStep)
  @IsOptional()
  step?: WorkflowStep;
}

export class WorkflowResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  examId!: string;

  @ApiProperty({ enum: WorkflowStep })
  currentStep!: WorkflowStep;

  @ApiProperty({ enum: WorkflowStatus })
  status!: WorkflowStatus;

  @ApiProperty()
  completionPercentage!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
