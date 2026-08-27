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
      sectionName: 'Section 1',
      questions: [
        { id: 'q1', type: 'MCQ', text: 'Q1', options: [], orderIndex: 0, questionHash: 'h1' },
        { id: 'q2', type: 'MSQ', text: 'Q2', options: [], orderIndex: 1, questionHash: 'h2' },
      ],
    },
  ],
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

  // ─── resetExecutionState — bug fix: stale submissionStatus across navigation ──

  it('resetExecutionState: clears submissionStatus SUCCESS — core bug fix (overlay not shown on re-exam)', () => {
    // Simulate: candidate submitted an exam — store has SUCCESS + answers + testInstance
    useExecutionStore.getState().initializeTest(mockTest);
    useExecutionStore.getState().saveAnswer('q1', { selectedOptionId: 'opt1' });
    useExecutionStore.getState().setSubmissionStatus('SUCCESS');

    // Sanity: this stale state was causing the full-screen overlay on re-exam navigation
    expect(useExecutionStore.getState().submissionStatus).toBe('SUCCESS');
    expect(useExecutionStore.getState().testInstance).not.toBeNull();
    expect(Object.keys(useExecutionStore.getState().answers)).toHaveLength(1);

    // Act: useExecution now calls this at the very start of every new session load
    useExecutionStore.getState().resetExecutionState();

    const s = useExecutionStore.getState();
    // The overlay-triggering flag MUST be IDLE — this is the fix
    expect(s.submissionStatus).toBe('IDLE');
    // All session data must be wiped
    expect(s.testInstance).toBeNull();
    expect(s.questions).toHaveLength(0);
    expect(s.answers).toEqual({});
    expect(s.palette).toHaveLength(0);
    // loading=true means ExecutionSkeleton is shown, not the stale exam UI with overlay
    expect(s.loading).toBe(true);
    expect(s.error).toBeNull();
  });

  it('resetExecutionState: clears SUBMITTING status (mid-submit page navigation edge case)', () => {
    // Simulate: submission was in flight when candidate navigated away
    useExecutionStore.getState().setSubmissionStatus('SUBMITTING');

    useExecutionStore.getState().resetExecutionState();

    expect(useExecutionStore.getState().submissionStatus).toBe('IDLE');
  });

  it('resetExecutionState: clears all runtime flags so a fresh exam session starts clean', () => {
    // Simulate: fully active exam session with all runtime flags set
    useExecutionStore.getState().initializeTest(mockTest);
    useExecutionStore.getState().setSubmissionStatus('FAILED');
    useExecutionStore.getState().setAttemptedResume(true);
    useExecutionStore.getState().setRecovered(true);
    useExecutionStore.getState().setUnsavedChanges(true);
    useExecutionStore.getState().setAutosaveStatus('SAVING');
    useExecutionStore.getState().setInteractionBlocked(true);

    useExecutionStore.getState().resetExecutionState();

    const s = useExecutionStore.getState();
    expect(s.submissionStatus).toBe('IDLE');
    expect(s.hasAttemptedResume).toBe(false);
    expect(s.isRecovered).toBe(false);
    expect(s.hasUnsavedChanges).toBe(false);
    expect(s.autosaveStatus).toBe('IDLE');
    expect(s.isInteractionBlocked).toBe(false);
    expect(s.pendingSectionChangeTarget).toBeNull();
    expect(s.currentSectionIndex).toBe(0);
    expect(s.lockedSectionKeys).toHaveLength(0);
    expect(s.sectionRemainingTime).toBe(0);
    expect(s.sectionTimingEnabled).toBe(false);
  });

  it('resetExecutionState: initializeTest works correctly after a reset (submit → reset → new exam lifecycle)', () => {
    // Full lifecycle: exam submitted → reset → brand new exam begins
    useExecutionStore.getState().initializeTest(mockTest);
    useExecutionStore.getState().setSubmissionStatus('SUCCESS');
    useExecutionStore.getState().resetExecutionState();

    // New exam session starts (new testInstanceId in reality, same mock here)
    useExecutionStore.getState().initializeTest(mockTest);

    const s = useExecutionStore.getState();
    expect(s.testInstance).toEqual(mockTest);
    expect(s.questions).toHaveLength(2);
    // loading=false means ExecutionLayout renders correctly (not the skeleton)
    expect(s.loading).toBe(false);
    // submissionStatus must stay IDLE — NOT inherited from the previous session
    expect(s.submissionStatus).toBe('IDLE');
    expect(s.palette[0]).toBe('CURRENT');
    expect(s.palette[1]).toBe('UNANSWERED');
  });
});
