export type QuestionGenerationStatus = 'Draft' | 'Approved' | 'Rejected' | 'Published';
export type GenerationMethod = 'AI' | 'Formula' | 'Static' | 'Dynamic';

export interface GeneratedQuestion {
  id: string;
  templateId: string;
  conceptId: string;
  topicId: string;
  statement: string;
  instructions?: string;
  options?: any[];
  correctAnswer?: any;
  explanation?: string;
  resolvedVariables?: Record<string, any>;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  generationMethod: GenerationMethod;
  status: QuestionGenerationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationHistoryEntry {
  id: string;
  templateId: string;
  batchSize: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  status: 'Completed' | 'Failed' | 'In Progress';
}
