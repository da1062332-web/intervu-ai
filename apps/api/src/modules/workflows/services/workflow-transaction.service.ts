import { Injectable, ConflictException, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  Prisma,
  ExamWorkflow,
  WorkflowStep,
  WorkflowStatus,
} from "@prisma/client";

export interface TransitionParams {
  workflowId: string;
  expectedVersion: number;
  newStep: WorkflowStep;
  newStatus: WorkflowStatus;
  newPercentage: number;
  historyEntry: Omit<
    Prisma.ExamWorkflowHistoryCreateInput,
    "workflow" | "workflowId"
  >;
}

export interface FailureParams {
  workflowId: string;
  expectedVersion: number;
  reason: string;
  historyEntry: Omit<
    Prisma.ExamWorkflowHistoryCreateInput,
    "workflow" | "workflowId"
  >;
}

@Injectable()
export class WorkflowTransactionService {
  private readonly logger = new Logger(WorkflowTransactionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async executeTransition(params: TransitionParams): Promise<ExamWorkflow> {
    const {
      workflowId,
      expectedVersion,
      newStep,
      newStatus,
      newPercentage,
      historyEntry,
    } = params;

    return this.prisma.$transaction(async (tx) => {
      // Optimistic concurrency control using version
      const updateResult = await tx.examWorkflow.updateMany({
        where: { id: workflowId, version: expectedVersion },
        data: {
          currentStep: newStep,
          status: newStatus,
          completionPercentage: newPercentage,
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        this.logger.warn(
          `Concurrency conflict detected on workflow ${workflowId} (expected version ${expectedVersion})`,
        );
        throw new ConflictException(
          "Workflow was concurrently modified. Please reload and retry.",
        );
      }

      const workflow = await tx.examWorkflow.findUniqueOrThrow({
        where: { id: workflowId },
      });

      await tx.examWorkflowHistory.create({
        data: {
          ...historyEntry,
          workflowId: workflow.id,
        },
      });

      return workflow;
    });
  }

  async executeFailure(params: FailureParams): Promise<ExamWorkflow> {
    const { workflowId, expectedVersion, reason, historyEntry } = params;

    return this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.examWorkflow.updateMany({
        where: { id: workflowId, version: expectedVersion },
        data: {
          status: WorkflowStatus.FAILED,
          metadata: { failureReason: reason },
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          "Workflow was concurrently modified. Please reload and retry.",
        );
      }

      const workflow = await tx.examWorkflow.findUniqueOrThrow({
        where: { id: workflowId },
      });

      await tx.examWorkflowHistory.create({
        data: {
          ...historyEntry,
          workflowId: workflow.id,
          reason,
        },
      });

      return workflow;
    });
  }

  async executeRetry(
    workflowId: string,
    expectedVersion: number,
    step: WorkflowStep,
    historyEntry: Omit<
      Prisma.ExamWorkflowHistoryCreateInput,
      "workflow" | "workflowId"
    >,
  ): Promise<ExamWorkflow> {
    return this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.examWorkflow.updateMany({
        where: { id: workflowId, version: expectedVersion },
        data: {
          status: WorkflowStatus.IN_PROGRESS,
          currentStep: step,
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          "Workflow was concurrently modified. Please reload and retry.",
        );
      }

      const workflow = await tx.examWorkflow.findUniqueOrThrow({
        where: { id: workflowId },
      });

      await tx.examWorkflowHistory.create({
        data: {
          ...historyEntry,
          workflowId: workflow.id,
        },
      });

      return workflow;
    });
  }
}
