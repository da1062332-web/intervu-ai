import { WorkflowStep, WorkflowStatus } from "@prisma/client";
import { ConflictException } from "@nestjs/common";

export class WorkflowStateMachine {
  static readonly STEP_ORDER: WorkflowStep[] = [
    WorkflowStep.CONFIGURATION,
    WorkflowStep.QUESTION_GENERATION,
    WorkflowStep.QUESTION_REVIEW,
    WorkflowStep.ASSEMBLY,
    WorkflowStep.PUBLISHING,
    WorkflowStep.COMPLETED,
  ];

  static readonly TERMINAL_STATES: WorkflowStatus[] = [
    WorkflowStatus.COMPLETED,
    WorkflowStatus.FAILED,
  ];

  static getNextStep(current: WorkflowStep): WorkflowStep {
    const idx = this.STEP_ORDER.indexOf(current);
    if (idx === -1) throw new Error(`Unknown step: ${current}`);
    if (idx === this.STEP_ORDER.length - 1) {
      throw new ConflictException("Already at the final step");
    }
    return this.STEP_ORDER[idx + 1];
  }

  static getPreviousStep(current: WorkflowStep): WorkflowStep {
    const idx = this.STEP_ORDER.indexOf(current);
    if (idx === -1) throw new Error(`Unknown step: ${current}`);
    if (idx === 0) {
      throw new ConflictException("Already at the first step");
    }
    return this.STEP_ORDER[idx - 1];
  }

  static canAdvance(current: WorkflowStep, status: WorkflowStatus): boolean {
    if (this.isTerminal(status)) return false;
    if (current === WorkflowStep.COMPLETED) return false;
    return true;
  }

  static canRollback(current: WorkflowStep, status: WorkflowStatus): boolean {
    // COMPLETED workflows cannot be rolled back
    if (status === WorkflowStatus.COMPLETED) return false;
    // FAILED workflows CAN be rolled back — that's the recovery path
    // Only block rollback from the very first step
    if (current === WorkflowStep.CONFIGURATION) return false;
    return true;
  }

  static canRetry(step: WorkflowStep): boolean {
    const retryableSteps: WorkflowStep[] = [
      WorkflowStep.QUESTION_GENERATION,
      WorkflowStep.QUESTION_REVIEW,
      WorkflowStep.ASSEMBLY,
      WorkflowStep.PUBLISHING,
    ];
    return retryableSteps.includes(step);
  }

  static isTerminal(status: WorkflowStatus): boolean {
    return this.TERMINAL_STATES.includes(status);
  }

  static getCompletionPercentage(step: WorkflowStep): number {
    switch (step) {
      case WorkflowStep.CONFIGURATION:
        return 10;
      case WorkflowStep.QUESTION_GENERATION:
        return 30;
      case WorkflowStep.QUESTION_REVIEW:
        return 50;
      case WorkflowStep.ASSEMBLY:
        return 70;
      case WorkflowStep.PUBLISHING:
        return 90;
      case WorkflowStep.COMPLETED:
        return 100;
      default:
        return 0;
    }
  }
}
