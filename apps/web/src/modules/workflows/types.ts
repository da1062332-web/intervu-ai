export enum WorkflowStep {
  CONFIGURATION = 'CONFIGURATION',
  QUESTION_GENERATION = 'QUESTION_GENERATION',
  QUESTION_REVIEW = 'QUESTION_REVIEW',
  ASSEMBLY = 'ASSEMBLY',
  PUBLISHING = 'PUBLISHING',
}

export enum WorkflowStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  BLOCKED = 'BLOCKED',
}

export interface NextAction {
  label: string;
  route: string;
  actionKey: string;
}

export interface StepStatus {
  status: WorkflowStatus;
  progress: number;
  startedAt?: string | null;
  finishedAt?: string | null;
  errorReason?: string | null;
}

export interface WorkflowDashboardItem {
  id: string;
  examId: string;
  examName: string;
  workflowStatus: WorkflowStatus;
  currentStep: WorkflowStep;
  completionPercentage: number;
  pendingAction?: NextAction;
  createdAt: string;
  lastUpdated: string;
}

export interface WorkflowStatusDetails {
  status: WorkflowStatus;
  currentStep: WorkflowStep;
  completionPercentage: number;
  nextAction: NextAction;
  configuration: StepStatus;
  questionGeneration: StepStatus;
  questionReview: StepStatus;
  assembly: StepStatus;
  publishing: StepStatus;
  history?: any[];
}
