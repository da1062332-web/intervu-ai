import { WorkflowStep, WorkflowStatus } from './types';

export const WORKFLOW_STEP_LABELS: Record<string, string> = {
  [WorkflowStep.CONFIGURATION]: 'Test Configuration',
  [WorkflowStep.QUESTION_GENERATION]: 'Question Generation',
  [WorkflowStep.QUESTION_REVIEW]: 'Question Review',
  [WorkflowStep.ASSEMBLY]: 'Test Assembly',
  [WorkflowStep.PUBLISHING]: 'Publishing',
  COMPLETED: 'Completed',
};

export const WORKFLOW_STATUS_COLORS: Record<WorkflowStatus, string> = {
  [WorkflowStatus.NOT_STARTED]: 'text-gray-500 bg-gray-100',
  [WorkflowStatus.IN_PROGRESS]: 'text-blue-600 bg-blue-50',
  [WorkflowStatus.COMPLETED]: 'text-green-600 bg-green-50',
  [WorkflowStatus.FAILED]: 'text-red-600 bg-red-50',
  [WorkflowStatus.BLOCKED]: 'text-yellow-600 bg-yellow-50',
};

export const WORKFLOW_STEPS_ORDER = [
  WorkflowStep.CONFIGURATION,
  WorkflowStep.QUESTION_GENERATION,
  WorkflowStep.QUESTION_REVIEW,
  WorkflowStep.ASSEMBLY,
  WorkflowStep.PUBLISHING,
];
