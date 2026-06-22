import { TestSection } from './TestSection';

export interface Test {
  id: string;
  company: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  sections: TestSection[];
  syllabus?: string[];
  eligibility?: string[];
}
