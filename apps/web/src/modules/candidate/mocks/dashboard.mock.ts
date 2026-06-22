import { CandidateDashboardData } from '../types/Dashboard';

export const mockCandidateDashboardData: CandidateDashboardData = {
  availableTests: [
    {
      id: 'tcs-nqt-001',
      title: 'TCS NQT Cognitive Assessment',
      durationMinutes: 90,
      sections: ['Numerical Ability', 'Verbal Ability', 'Reasoning Ability'],
      status: 'AVAILABLE',
    },
    {
      id: 'react-core-002',
      title: 'React & Frontend Core Assessment',
      durationMinutes: 60,
      sections: ['React Hooks & State', 'Performance Optimization', 'Web Core & DOM'],
      status: 'EXPIRING_SOON',
    },
    {
      id: 'js-fundamentals-004',
      title: 'JavaScript Core Foundations',
      durationMinutes: 45,
      sections: ['Scope & Closures', 'Asynchronous JS', 'Prototypes & Objects'],
      status: 'AVAILABLE',
    },
  ],
  activeTests: [
    {
      id: 'test-2',
      title: 'Frontend React Assessment',
      remainingMinutes: 43,
      status: 'IN_PROGRESS',
    },
  ],
  completedAttempts: [
    {
      id: 'attempt-1',
      assessmentName: 'Python DSA & Algorithm Bootcamp',
      score: 92,
      completedDate: '2026-06-15T14:30:00Z',
      status: 'Completed',
    },
    {
      id: 'attempt-2',
      assessmentName: 'High-Level System Design Challenge',
      score: 78,
      completedDate: '2026-06-10T11:00:00Z',
      status: 'Completed',
    },
  ],
  recommendations: {
    overallScore: 85,
    confidenceScore: 89,
    recommendationSummary:
      'Focus on System Design caching strategies and Advanced JavaScript prototyping mechanisms.',
  },
  skillProgress: [
    { skill: 'Data Structures', score: 92 },
    { skill: 'System Design', score: 78 },
    { skill: 'React Framework', score: 85 },
    { skill: 'JavaScript Core', score: 90 },
  ],
};
