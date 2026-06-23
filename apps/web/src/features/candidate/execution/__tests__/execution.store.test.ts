import { describe, it, expect, beforeEach } from 'vitest';
import { useExecutionStore } from '../stores/execution.store';
import { TestInstance } from '../types/execution.types';

const mockTest: TestInstance = {
  id: 'test-1',
  testConfigId: 'config-1',
  userId: 'user-1',
  assessmentName: 'Test',
  candidateName: 'User',
  status: 'IN_PROGRESS',
  durationSeconds: 3600,
  sections: [
    {
      id: 'sec-1',
      sectionKey: 's1',
      title: 'Section 1',
      questions: [
        { id: 'q1', type: 'MCQ', text: 'Q1', options: [], orderIndex: 0, questionHash: 'h1' },
        { id: 'q2', type: 'MSQ', text: 'Q2', options: [], orderIndex: 1, questionHash: 'h2' }
      ]
    }
  ]
};

describe('execution.store', () => {
  beforeEach(() => {
    useExecutionStore.setState({
      testInstance: null,
      questions: [],
      currentQuestionIndex: 0,
      currentQuestion: null,
      answers: {},
      palette: [],
      remainingTime: 0,
    });
  });

  it('initializes test correctly', () => {
    useExecutionStore.getState().initializeTest(mockTest);
    
    const state = useExecutionStore.getState();
    expect(state.testInstance).toEqual(mockTest);
    expect(state.questions.length).toBe(2);
    expect(state.currentQuestionIndex).toBe(0);
    expect(state.palette[0]).toBe('CURRENT');
    expect(state.palette[1]).toBe('UNANSWERED');
  });

  it('saves answer and updates palette', () => {
    useExecutionStore.getState().initializeTest(mockTest);
    useExecutionStore.getState().saveAnswer('q1', { selectedOptionId: 'opt1' });
    
    const state = useExecutionStore.getState();
    expect(state.answers['q1'].selectedOptionId).toBe('opt1');
    expect(state.hasUnsavedChanges).toBe(true);
  });

  it('navigates to next question', () => {
    useExecutionStore.getState().initializeTest(mockTest);
    useExecutionStore.getState().goNext();
    
    const state = useExecutionStore.getState();
    expect(state.currentQuestionIndex).toBe(1);
    expect(state.palette[0]).toBe('UNANSWERED'); // Because we didn't save an answer
    expect(state.palette[1]).toBe('CURRENT');
  });

  it('toggles review state', () => {
    useExecutionStore.getState().initializeTest(mockTest);
    useExecutionStore.getState().toggleReview('q1');
    
    let state = useExecutionStore.getState();
    expect(state.answers['q1'].status).toBe('MARKED_FOR_REVIEW');
    
    useExecutionStore.getState().toggleReview('q1');
    state = useExecutionStore.getState();
    expect(state.answers['q1'].status).toBe('UNANSWERED');
  });
});
