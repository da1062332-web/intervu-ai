import { WorkflowStateMachine } from './workflow-state-machine';
import { WorkflowStep, WorkflowStatus } from '@prisma/client';

describe('WorkflowStateMachine', () => {
  it('should get next step', () => {
    expect(WorkflowStateMachine.getNextStep(WorkflowStep.CONFIGURATION)).toBe(WorkflowStep.QUESTION_GENERATION);
    expect(WorkflowStateMachine.getNextStep(WorkflowStep.QUESTION_GENERATION)).toBe(WorkflowStep.QUESTION_REVIEW);
    expect(WorkflowStateMachine.getNextStep(WorkflowStep.PUBLISHING)).toBe(WorkflowStep.COMPLETED);
    expect(() => WorkflowStateMachine.getNextStep(WorkflowStep.COMPLETED)).toThrow('Already at the final step');
  });

  it('should validate transitions correctly', () => {
    expect(WorkflowStateMachine.canAdvance(WorkflowStep.CONFIGURATION, WorkflowStatus.COMPLETED)).toBe(false);
    expect(WorkflowStateMachine.canAdvance(WorkflowStep.CONFIGURATION, WorkflowStatus.IN_PROGRESS)).toBe(true);
    expect(WorkflowStateMachine.canAdvance(WorkflowStep.COMPLETED, WorkflowStatus.COMPLETED)).toBe(false);
  });

  it('should validate retry', () => {
    expect(WorkflowStateMachine.canRetry(WorkflowStep.QUESTION_GENERATION)).toBe(true);
    expect(WorkflowStateMachine.canRetry(WorkflowStep.CONFIGURATION)).toBe(false);
  });
});
