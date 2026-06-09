import { CandidateDashboardData } from '../types/candidateDashboard.types';

export const mockCandidateDashboardData: CandidateDashboardData = {
  availableTests: [
    {
      id: 'tcs-nqt-001',
      title: 'TCS NQT Cognitive Assessment',
      durationMinutes: 90,
      sections: ['Numerical', 'Verbal', 'Reasoning'],
      status: 'AVAILABLE',
    },
  ],
  activeTests: [
    {
      id: 'test-2',
      title: 'Frontend React Assessment',
      remainingMinutes: 53,
      status: 'IN_PROGRESS',
    },
  ],
  completedAttempts: [
    {
      id: 'attempt-1',
      assessmentName: 'Frontend React Assessment',
      score: 86,
      completedDate: '2026-06-02T10:00:00Z',
      status: 'Completed',
    },
  ],
  recommendations: {
    overallScore: 86,
    confidenceScore: 91,
    recommendationSummary: 'Improve TypeScript Generics',
  },
  skillProgress: [
    { skill: 'React', score: 92 },
    { skill: 'TypeScript', score: 84 },
    { skill: 'System Design', score: 78 },
  ],
};
