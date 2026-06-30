import { ApiProperty } from '@nestjs/swagger';
import { WorkflowStep, WorkflowStatus } from '@prisma/client';

export class StepStatus {
  @ApiProperty({ enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'BLOCKED'] })
  status!: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'BLOCKED';

  @ApiProperty({ description: 'Progress from 0 to 100' })
  progress!: number;

  @ApiProperty({ required: false, nullable: true })
  startedAt!: string | null;

  @ApiProperty({ required: false, nullable: true })
  finishedAt!: string | null;

  @ApiProperty({ required: false, nullable: true })
  errorReason!: string | null;
}

export class NextAction {
  @ApiProperty()
  label!: string;

  @ApiProperty()
  route!: string;

  @ApiProperty()
  actionKey!: string;
}

export class WorkflowStatusDto {
  @ApiProperty()
  configuration!: StepStatus;

  @ApiProperty()
  questionGeneration!: StepStatus;

  @ApiProperty()
  questionReview!: StepStatus;

  @ApiProperty()
  assembly!: StepStatus;

  @ApiProperty()
  publishing!: StepStatus;

  @ApiProperty({ enum: WorkflowStatus })
  status!: WorkflowStatus;

  @ApiProperty()
  completionPercentage!: number;

  @ApiProperty({ enum: WorkflowStep })
  currentStep!: WorkflowStep;

  @ApiProperty()
  nextAction!: NextAction;
}
