import { Injectable, ConflictException } from '@nestjs/common';
import { WorkflowStep, WorkflowStatus } from '@prisma/client';
import { WorkflowStateMachine } from '../state-machine/workflow-state-machine';

@Injectable()
export class WorkflowTransitionGuard {
  canAdvance(currentStep: WorkflowStep, status: WorkflowStatus): void {
    if (!WorkflowStateMachine.canAdvance(currentStep, status)) {
      throw new ConflictException(
        `Cannot advance workflow from step ${currentStep} in status ${status}`,
      );
    }
  }

  canRollback(currentStep: WorkflowStep, status: WorkflowStatus): void {
    if (!WorkflowStateMachine.canRollback(currentStep, status)) {
      throw new ConflictException(
        `Cannot rollback workflow from step ${currentStep} in status ${status}`,
      );
    }
  }

  canPublish(currentStep: WorkflowStep, status: WorkflowStatus): void {
    if (
      status !== WorkflowStatus.IN_PROGRESS ||
      currentStep !== WorkflowStep.PUBLISHING
    ) {
      throw new ConflictException(
        `Workflow is not in a publishable state (currentStep: ${currentStep}, status: ${status})`,
      );
    }
  }

  canRetry(currentStep: WorkflowStep, status: WorkflowStatus): void {
    if (status !== WorkflowStatus.FAILED) {
      throw new ConflictException(`Workflow must be in FAILED status to retry`);
    }
    if (!WorkflowStateMachine.canRetry(currentStep)) {
      throw new ConflictException(`Step ${currentStep} is not retryable`);
    }
  }
}
