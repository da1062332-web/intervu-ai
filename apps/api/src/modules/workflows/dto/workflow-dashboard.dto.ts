import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { WorkflowStep, WorkflowStatus } from "@prisma/client";
import { NextAction } from "./workflow-status.dto";

export class WorkflowDashboardDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  examId!: string;

  @ApiProperty()
  examName!: string;

  @ApiProperty({ enum: WorkflowStatus })
  workflowStatus!: WorkflowStatus;

  @ApiProperty({ enum: WorkflowStep })
  currentStep!: WorkflowStep;

  @ApiProperty()
  completionPercentage!: number;

  @ApiPropertyOptional()
  pendingAction!: NextAction;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  lastUpdated!: string;
}
