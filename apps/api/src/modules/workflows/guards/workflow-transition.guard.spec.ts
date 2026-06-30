import { WorkflowTransitionGuard } from './workflow-transition.guard';
import { WorkflowStep, WorkflowStatus } from '@prisma/client';

describe('WorkflowTransitionGuard', () => {
  it('should allow valid transitions', () => {
    expect(() => {
      WorkflowTransitionGuard.prototype.canAdvance(
        WorkflowStep.CONFIGURATION,
        WorkflowStatus.IN_PROGRESS
      );
    }).not.toThrow();
  });

  it('should throw Error for invalid transitions', () => {
    expect(() => {
      WorkflowTransitionGuard.prototype.canAdvance(
        WorkflowStep.CONFIGURATION,
        WorkflowStatus.COMPLETED
      );
    }).toThrow('Cannot advance workflow');
  });
});
