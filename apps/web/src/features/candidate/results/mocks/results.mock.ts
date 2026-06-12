import {
  EvaluationResult,
  SkillScore,
  Recommendation,
  PerformanceSummary,
} from '../types/results.types';

export const mockEvaluationResult: EvaluationResult = {
  id: 'eval-12345',
  testId: 'tcs-nqt-001',
  candidateName: 'John Doe',
  testName: 'TCS NQT Cognitive Assessment',
  overallScore: 78,
  confidenceScore: 92,
  totalQuestions: 40,
  correctAnswers: 31,
  submittedAt: new Date().toISOString(),
};

export const mockSkillScores: SkillScore[] = [
  {
    id: 'skill-1',
    name: 'Reasoning',
    score: 92,
    feedback: 'Excellent analytical and deductive skills.',
  },
  {
    id: 'skill-2',
    name: 'Probability',
    score: 85,
    feedback: 'Strong understanding of probabilistic concepts.',
  },
  {
    id: 'skill-3',
    name: 'Aptitude',
    score: 76,
    feedback: 'Solid performance with minor areas for improvement.',
  },
  {
    id: 'skill-4',
    name: 'Percentages',
    score: 55,
    feedback: 'Needs improvement. Practice foundational percentage rules.',
  },
  {
    id: 'skill-5',
    name: 'Time & Work',
    score: 45,
    feedback: 'Weak area. Highly recommended to focus on formulas.',
  },
];

export const mockRecommendations: Recommendation[] = [
  {
    id: 'rec-1',
    priority: 'HIGH',
    title: 'Improve Time & Work Equations',
    description:
      'You struggled significantly with Time & Work questions. Review the foundational formulas and practice 20-30 basic problems.',
  },
  {
    id: 'rec-2',
    priority: 'HIGH',
    title: 'Practice Percentage Calculations',
    description:
      'Your accuracy on percentage-based questions was lower than expected. Focus on rapid mental math for fractions to percentages.',
  },
  {
    id: 'rec-3',
    priority: 'MEDIUM',
    title: 'Refine Aptitude Speed',
    description:
      'While your accuracy is good, your time-per-question on general aptitude could be improved for better overall pacing.',
  },
  {
    id: 'rec-4',
    priority: 'LOW',
    title: 'Maintain Reasoning Excellence',
    description:
      'You demonstrated exceptional reasoning capabilities. Continue practicing high-difficulty logic puzzles to maintain this strength.',
  },
];

export const mockPerformanceSummary: PerformanceSummary = {
  testsCompleted: 4,
  averageScore: 72,
  bestScore: 88,
  lastAssessmentDate: new Date(Date.now() - 86400000 * 5).toISOString(),
};
