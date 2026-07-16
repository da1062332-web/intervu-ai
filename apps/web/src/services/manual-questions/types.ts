export interface ManualQuestion {
  id: string;
  questionText: string;
  answer: string;
  explanation?: string;
  topicId: string;
  sectionId: string;
  conceptId?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  source: string;
  questionSource: 'MANUAL' | 'VARIABLE_TEMPLATE';
  questionType: 'MCQ' | 'CODING' | 'TRUE_FALSE';
  estimatedTime?: number;
  questionTitle?: string;
  questionStatement?: string;
  instructions?: string;
  questionImage?: string;
  options?: string[];
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface ManualQuestionFilters {
  search?: string;
  topicId?: string;
  conceptId?: string;
  sectionId?: string;
  difficulty?: string;
  status?: string;
  page?: number;
  limit?: number;
}
