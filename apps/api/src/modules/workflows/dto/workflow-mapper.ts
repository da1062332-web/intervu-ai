import { ExamWorkflow, ExamConfig } from "@prisma/client";
import { WorkflowDashboardDto } from "./workflow-dashboard.dto";
import { NextAction, WorkflowStatusDto } from "./workflow-status.dto";
import { WorkflowResponseDto } from "./workflow.dto";

export type ExamWorkflowWithConfig = ExamWorkflow & {
  examConfig: Pick<ExamConfig, "name">;
};

export function toWorkflowDashboardDto(
  workflow: ExamWorkflowWithConfig,
  nextAction: NextAction,
): WorkflowDashboardDto {
  return {
    id: workflow.id,
    examId: workflow.examId,
    examName: workflow.examConfig?.name || "Unknown Exam",
    workflowStatus: workflow.status,
    currentStep: workflow.currentStep,
    completionPercentage: workflow.completionPercentage,
    pendingAction: nextAction,
    createdAt: workflow.createdAt.toISOString(),
    lastUpdated: workflow.updatedAt.toISOString(),
  };
}

export function toWorkflowResponseDto(
  workflow: ExamWorkflow,
): WorkflowResponseDto {
  return {
    id: workflow.id,
    examId: workflow.examId,
    currentStep: workflow.currentStep,
    status: workflow.status,
    completionPercentage: workflow.completionPercentage,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
  };
}

export function toWorkflowStatusDto(
  statusData: Omit<
    WorkflowStatusDto,
    "nextAction" | "currentStep" | "completionPercentage" | "status"
  >,
  workflow: ExamWorkflow,
  nextAction: NextAction,
): WorkflowStatusDto {
  return {
    ...statusData,
    status: workflow.status,
    currentStep: workflow.currentStep,
    completionPercentage: workflow.completionPercentage,
    nextAction,
  };
}
