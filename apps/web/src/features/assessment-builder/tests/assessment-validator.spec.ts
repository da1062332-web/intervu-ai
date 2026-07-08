import { validateAssessment } from '../validators/assessment-validator';
import type { ExamConfig } from '@/services/exam-configs/types';
import type { Assessment, GeneratedQuestion } from '../types';

describe('Assessment Validator', () => {
  it('should validate a correct assessment', () => {
    const blueprint = {
      id: 'cfg-1',
      totalQuestions: 2,
      sections: [{ id: 'sec-1', name: 'General', questionCount: 2 }]
    } as unknown as ExamConfig;

    const assessment: Assessment = {
      testId: 'test-1',
      title: 'Mock Test',
      companyId: 'company-1',
      examConfigId: 'cfg-1',
      status: 'COMPLETED',
      sections: [
        {
          id: 'sec-1',
          name: 'General',
          questions: [
            { id: 'q1', questionText: 'Q1', answer: 'A', explanation: 'E', difficulty: 'EASY', conceptKey: 'C' },
            { id: 'q2', questionText: 'Q2', answer: 'B', explanation: 'E', difficulty: 'HARD', conceptKey: 'C' }
          ]
        }
      ]
    };

    const result = validateAssessment(blueprint, assessment);
    
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should return errors for missing questions', () => {
    const blueprint = {
      id: 'cfg-1',
      totalQuestions: 5,
    } as unknown as ExamConfig;

    const assessment: Assessment = {
      testId: 'test-1',
      title: 'Mock Test',
      companyId: 'company-1',
      examConfigId: 'cfg-1',
      status: 'COMPLETED',
      questions: [
        { id: 'q1', questionText: 'Q1', answer: 'A', explanation: 'E', difficulty: 'EASY', conceptKey: 'C' }
      ]
    };

    const result = validateAssessment(blueprint, assessment);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Expected 5 total questions, but got 1.');
  });

  it('should warn for missing topics and concepts', () => {
    const blueprint = {
      id: 'cfg-1',
      totalQuestions: 1,
    } as unknown as ExamConfig;

    const assessment: Assessment = {
      testId: 'test-1',
      title: 'Mock Test',
      companyId: 'company-1',
      examConfigId: 'cfg-1',
      status: 'COMPLETED',
      questions: [
        { id: 'q1', questionText: 'Q1', answer: 'A', explanation: 'E', difficulty: 'EASY', conceptKey: '' } // missing topicId and conceptKey
      ]
    };

    const result = validateAssessment(blueprint, assessment);
    
    expect(result.warnings).toContain('1 questions are missing topic assignments.');
    expect(result.warnings).toContain('1 questions are missing concept assignments.');
  });

  it('should error for empty sections', () => {
    const blueprint = {
      id: 'cfg-1',
      totalQuestions: 0,
    } as unknown as ExamConfig;

    const assessment: Assessment = {
      testId: 'test-1',
      title: 'Mock Test',
      companyId: 'company-1',
      examConfigId: 'cfg-1',
      status: 'COMPLETED',
      sections: [
        { id: 'sec-1', name: 'Empty Section', questions: [] }
      ]
    };

    const result = validateAssessment(blueprint, assessment);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Section "Empty Section" has no questions.');
  });
});
