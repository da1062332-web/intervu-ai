import { create } from 'zustand';
import {
  AnswerState,
  Question,
  QuestionStatus,
  TestInstance,
  AutosaveStatus,
  ConnectionStatus,
  SubmissionStatus,
} from '../types/execution.types';

interface ExecutionState {
  // Data
  testInstance: TestInstance | null;
  questions: Question[];

  // Execution State
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  answers: Record<string, AnswerState>;
  palette: QuestionStatus[];
  remainingTime: number;

  // Application State
  loading: boolean;
  error: string | null;

  // Day 4: Autosave, Recovery & Submission
  autosaveStatus: AutosaveStatus;
  lastSavedAt: Date | null;
  connectionStatus: ConnectionStatus;
  ping: number | null;
  submissionStatus: SubmissionStatus;
  isRecovered: boolean;
  hasAttemptedResume: boolean;
  hasUnsavedChanges: boolean;

  // Section Change State
  pendingSectionChangeTarget: number | null;

  // Fullscreen Block State
  isInteractionBlocked: boolean;
  setInteractionBlocked: (blocked: boolean) => void;

  // Section Timing State (Feature 6, 7, 8)
  /** Index of the currently active section */
  currentSectionIndex: number;
  /** Section keys of sections that are locked (cannot return to) */
  lockedSectionKeys: string[];
  /** Remaining time for the current section, in seconds */
  sectionRemainingTime: number;
  /** Whether section-wise timing is active for this assessment */
  sectionTimingEnabled: boolean;

  // Actions
  initializeTest: (testInstance: TestInstance) => void;
  jumpToQuestion: (index: number) => void;
  requestNextSection: () => void;
  requestSectionChange: (targetSectionIndex: number) => void;
  confirmSectionChange: () => void;
  cancelSectionChange: () => void;
  saveAnswer: (
    questionId: string,
    answerData: { selectedOptionId?: string; selectedOptionIds?: string[]; textResponse?: string },
  ) => void;
  toggleReview: (questionId: string) => void;
  markForReview: (questionId: string) => void;
  removeReview: (questionId: string) => void;
  goNext: () => void;
  goPrevious: () => void;
  setTimer: (time: number) => void;
  setSectionTimer: (time: number) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  // Section advance (Feature 7 & 8)
  advanceSectionLocally: (
    nextSectionIndex: number,
    lockedKeys: string[],
    sectionStartedAt: string | null,
    updatedTestInstance?: TestInstance,
  ) => void;
  syncQuestionsFromInstance: (updatedTestInstance: TestInstance) => void;

  // Day 4 Actions
  setAutosaveStatus: (status: AutosaveStatus) => void;
  setRecovered: (recovered: boolean) => void;
  setAttemptedResume: (attempted: boolean) => void;
  setSubmissionStatus: (status: SubmissionStatus) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setPing: (ping: number | null) => void;
  setUnsavedChanges: (unsaved: boolean) => void;
  restoreStateFromStorage: (savedState: {
    answers: Record<string, AnswerState>;
    currentQuestionIndex: number;
    remainingTime: number;
    currentSectionIndex?: number;
    lockedSectionKeys?: string[];
  }) => void;
  cleanupRuntime: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSectionIndex(testInstance: TestInstance | null, qIndex: number): number {
  if (!testInstance) return -1;
  let runningCount = 0;
  for (let i = 0; i < testInstance.sections.length; i++) {
    const section = testInstance.sections[i];
    if (qIndex >= runningCount && qIndex < runningCount + section.questions.length) {
      return i;
    }
    runningCount += section.questions.length;
  }
  return -1;
}

function applyPaletteUpdate(
  palette: QuestionStatus[],
  prevIndex: number,
  targetIndex: number,
  answers: Record<string, AnswerState>,
  questions: Question[],
): QuestionStatus[] {
  const newPalette = [...palette];
  const prevQuestion = questions[prevIndex];
  if (prevQuestion) {
    const answer = answers[prevQuestion.id];
    if (answer?.status === 'MARKED_FOR_REVIEW') {
      newPalette[prevIndex] = 'MARKED_FOR_REVIEW';
    } else {
      const hasAnswer = !!(
        answer?.selectedOptionId ||
        (answer?.selectedOptionIds && answer.selectedOptionIds.length > 0) ||
        answer?.textResponse
      );
      newPalette[prevIndex] = hasAnswer ? 'ANSWERED' : 'UNANSWERED';
    }
  }
  newPalette[targetIndex] = 'CURRENT';
  return newPalette;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  // Initial Data
  testInstance: null,
  questions: [],

  // Initial State
  currentQuestionIndex: 0,
  currentQuestion: null,
  answers: {},
  palette: [],
  remainingTime: 0,
  loading: true,
  error: null,
  pendingSectionChangeTarget: null,
  isInteractionBlocked: false,
  setInteractionBlocked: (blocked) => set({ isInteractionBlocked: blocked }),

  // Section Timing Initial State
  currentSectionIndex: 0,
  lockedSectionKeys: [],
  sectionRemainingTime: 0,
  sectionTimingEnabled: false,

  // Day 4 State
  autosaveStatus: 'IDLE',
  lastSavedAt: null,
  connectionStatus: 'ONLINE',
  ping: null,
  submissionStatus: 'IDLE',
  isRecovered: false,
  hasAttemptedResume: false,
  hasUnsavedChanges: false,

  initializeTest: (testInstance) => {
    const allQuestions = testInstance.sections.flatMap((s) => s.questions);
    const initialPalette = allQuestions.map(
      (_, i) => (i === 0 ? 'CURRENT' : 'UNANSWERED') as QuestionStatus,
    );

    // Derive current section index from backend
    const serverSectionIndex = testInstance.currentSectionIndex ?? 0;

    // Derive locked sections: all sections before currentSectionIndex with status LOCKED or COMPLETED
    const lockedKeys = testInstance.sections
      .filter(
        (s, idx) => idx < serverSectionIndex || s.status === 'LOCKED' || s.status === 'COMPLETED',
      )
      .map((s) => s.sectionKey);

    // Compute initial section remaining time from server clock + startedAt
    let sectionRemainingTime = 0;
    if (testInstance.sectionTimingEnabled) {
      const activeSection = testInstance.sections[serverSectionIndex];
      if (activeSection?.startedAt && activeSection?.durationSeconds) {
        const serverNow = testInstance.serverTime
          ? new Date(testInstance.serverTime).getTime()
          : Date.now();
        const sectionStarted = new Date(activeSection.startedAt).getTime();
        const elapsed = Math.floor((serverNow - sectionStarted) / 1000);
        sectionRemainingTime = Math.max(0, activeSection.durationSeconds - elapsed);
      } else if (testInstance.sections[serverSectionIndex]?.durationSeconds) {
        sectionRemainingTime = testInstance.sections[serverSectionIndex].durationSeconds!;
      }
    }

    // Figure out the starting question index (first question of active section, unless backend provided an index)
    let startingQuestionIndex = testInstance.currentQuestionIndex ?? 0;

    // If backend didn't provide a valid question index for the current section, calculate the first question of the current section
    if (startingQuestionIndex === 0) {
      let runningCount = 0;
      for (let i = 0; i < testInstance.sections.length; i++) {
        if (i === serverSectionIndex) {
          startingQuestionIndex = runningCount;
          break;
        }
        runningCount += testInstance.sections[i].questions.length;
      }
    }

    set({
      testInstance,
      questions: allQuestions,
      currentQuestionIndex: startingQuestionIndex,
      currentQuestion: allQuestions[startingQuestionIndex] || null,
      palette: initialPalette,
      remainingTime: testInstance.durationSeconds,
      answers: {},
      loading: false,
      error: null,
      isRecovered: false,
      hasAttemptedResume: false,
      currentSectionIndex: serverSectionIndex,
      lockedSectionKeys: lockedKeys,
      sectionRemainingTime,
      sectionTimingEnabled: testInstance.sectionTimingEnabled ?? false,
    });
  },

  restoreStateFromStorage: (savedState) => {
    set((state) => {
      if (!state.testInstance) return state;

      const questions = state.questions;
      const initialPalette = questions.map((q, i) => {
        if (i === savedState.currentQuestionIndex) return 'CURRENT' as QuestionStatus;
        const answer = savedState.answers[q.id];
        if (answer) {
          if (answer.status === 'MARKED_FOR_REVIEW') return 'MARKED_FOR_REVIEW' as QuestionStatus;
          if (
            answer.selectedOptionId ||
            (answer.selectedOptionIds && answer.selectedOptionIds.length > 0) ||
            answer.textResponse
          )
            return 'ANSWERED' as QuestionStatus;
        }
        return 'UNANSWERED' as QuestionStatus;
      });

      return {
        answers: savedState.answers,
        currentQuestionIndex: savedState.currentQuestionIndex,
        currentQuestion: questions[savedState.currentQuestionIndex],
        remainingTime: savedState.remainingTime,
        palette: initialPalette,
        isRecovered: true,
        hasAttemptedResume: true,
        currentSectionIndex: savedState.currentSectionIndex ?? state.currentSectionIndex,
        lockedSectionKeys: savedState.lockedSectionKeys ?? state.lockedSectionKeys,
      };
    });
  },

  cleanupRuntime: () => {
    try {
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
    } catch (e) {
      console.error('Failed to exit fullscreen during cleanup:', e);
    }

    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('intervu-cleanup-runtime'));
      }
    } catch (e) {
      console.error('Failed to dispatch cleanup event:', e);
    }
  },

  requestNextSection: () => {
    const state = get();
    if (!state.testInstance) return;
    const nextSecIdx = state.currentSectionIndex + 1;
    if (nextSecIdx < state.testInstance.sections.length) {
      set({ pendingSectionChangeTarget: nextSecIdx });
    }
  },

  requestSectionChange: (targetSectionIndex: number) => {
    const state = get();
    if (!state.testInstance) return;
    if (targetSectionIndex < 0 || targetSectionIndex >= state.testInstance.sections.length) return;
    const targetSectionKey = state.testInstance.sections[targetSectionIndex]?.sectionKey;
    if (targetSectionKey && state.lockedSectionKeys.includes(targetSectionKey)) return;
    if (state.sectionTimingEnabled && targetSectionIndex < state.currentSectionIndex) return;
    if (targetSectionIndex === state.currentSectionIndex) return;

    set({ pendingSectionChangeTarget: targetSectionIndex });
  },

  jumpToQuestion: (index) => {
    const state = get();
    if (index < 0) return;

    // If index is within loaded questions, check section boundaries
    if (index < state.questions.length) {
      const currentSectionIdx = getSectionIndex(state.testInstance, state.currentQuestionIndex);
      const targetSectionIdx = getSectionIndex(state.testInstance, index);
      const targetSectionKey = state.testInstance?.sections[targetSectionIdx]?.sectionKey;

      // Feature 7: Prevent navigation to locked sections
      if (targetSectionKey && state.lockedSectionKeys.includes(targetSectionKey)) {
        return;
      }

      // If changing sections (forward direction), intercept with a confirmation modal
      if (
        currentSectionIdx !== -1 &&
        targetSectionIdx !== -1 &&
        currentSectionIdx !== targetSectionIdx
      ) {
        if (state.sectionTimingEnabled && targetSectionIdx < currentSectionIdx) {
          return;
        }
        set({ pendingSectionChangeTarget: targetSectionIdx });
        return;
      }

      set((state) => ({
        ...applyPaletteUpdate(
          state.palette,
          state.currentQuestionIndex,
          index,
          state.answers,
          state.questions,
        ),
        currentQuestionIndex: index,
        currentQuestion: state.questions[index],
        palette: applyPaletteUpdate(
          state.palette,
          state.currentQuestionIndex,
          index,
          state.answers,
          state.questions,
        ),
        hasUnsavedChanges: true,
        pendingSectionChangeTarget: null,
      }));
    } else {
      // Index is beyond current section (e.g. jumping to next progressive section)
      const nextSecIdx = state.currentSectionIndex + 1;
      if (state.testInstance && nextSecIdx < state.testInstance.sections.length) {
        set({ pendingSectionChangeTarget: nextSecIdx });
      }
    }
  },

  confirmSectionChange: () => {
    const state = get();
    const targetIndex = state.pendingSectionChangeTarget;
    if (targetIndex === null) return;

    let targetSectionIdx = targetIndex;
    let targetQuestionIdx = targetIndex;

    if (state.testInstance && targetIndex < state.testInstance.sections.length) {
      let runningCount = 0;
      for (let i = 0; i < state.testInstance.sections.length; i++) {
        if (i === targetIndex) {
          targetQuestionIdx = runningCount;
          targetSectionIdx = i;
          break;
        }
        runningCount += state.testInstance.sections[i].questions.length;
      }
    }

    const newPalette = applyPaletteUpdate(
      state.palette,
      state.currentQuestionIndex,
      targetQuestionIdx,
      state.answers,
      state.questions,
    );

    set({
      currentSectionIndex: targetSectionIdx,
      currentQuestionIndex: targetQuestionIdx,
      currentQuestion: state.questions[targetQuestionIdx] || null,
      palette: newPalette,
      hasUnsavedChanges: true,
      pendingSectionChangeTarget: null,
    });
  },

  cancelSectionChange: () => {
    set({ pendingSectionChangeTarget: null });
  },

  /**
   * Called after the backend confirms section advance.
   * Locks previous sections in local state, updates active section index, and resets section timer.
   */
  advanceSectionLocally: (nextSectionIndex, lockedKeys, sectionStartedAt, updatedTestInstance) => {
    set((state) => {
      const instance = updatedTestInstance || state.testInstance;
      if (!instance) return state;

      const allQuestions = instance.sections.flatMap((s) => s.questions);

      // Calculate new section timer
      let sectionRemainingTime = 0;
      if (state.sectionTimingEnabled) {
        const nextSection = instance.sections[nextSectionIndex];
        if (nextSection?.durationSeconds) {
          if (sectionStartedAt) {
            const elapsed = Math.floor((Date.now() - new Date(sectionStartedAt).getTime()) / 1000);
            sectionRemainingTime = Math.max(0, nextSection.durationSeconds - elapsed);
          } else {
            sectionRemainingTime = nextSection.durationSeconds;
          }
        }
      }

      // Find the first question of the next section
      let startingQuestionIndex = 0;
      let runningCount = 0;
      for (let i = 0; i < instance.sections.length; i++) {
        if (i === nextSectionIndex) {
          startingQuestionIndex = runningCount;
          break;
        }
        runningCount += instance.sections[i].questions.length;
      }

      // Ensure palette has entries for all questions
      let currentPalette = state.palette;
      if (currentPalette.length < allQuestions.length) {
        const additionalPalette = allQuestions
          .slice(currentPalette.length)
          .map(() => 'UNANSWERED' as QuestionStatus);
        currentPalette = [...currentPalette, ...additionalPalette];
      }

      const newPalette = applyPaletteUpdate(
        currentPalette,
        state.currentQuestionIndex,
        startingQuestionIndex,
        state.answers,
        allQuestions,
      );

      return {
        testInstance: instance,
        questions: allQuestions,
        currentSectionIndex: nextSectionIndex,
        lockedSectionKeys: lockedKeys,
        sectionRemainingTime,
        currentQuestionIndex: startingQuestionIndex,
        currentQuestion: allQuestions[startingQuestionIndex] || null,
        palette: newPalette,
        pendingSectionChangeTarget: null,
      };
    });
  },

  syncQuestionsFromInstance: (updatedTestInstance: TestInstance) => {
    set((state) => {
      const allQuestions = updatedTestInstance.sections.flatMap((s) => s.questions);
      let startingQuestionIndex = state.currentQuestionIndex;
      let runningCount = 0;
      for (let i = 0; i < updatedTestInstance.sections.length; i++) {
        if (i === state.currentSectionIndex) {
          if (
            startingQuestionIndex < runningCount ||
            startingQuestionIndex >= runningCount + updatedTestInstance.sections[i].questions.length
          ) {
            startingQuestionIndex = runningCount;
          }
          break;
        }
        runningCount += updatedTestInstance.sections[i].questions.length;
      }

      let currentPalette = state.palette;
      if (currentPalette.length < allQuestions.length) {
        const additionalPalette = allQuestions
          .slice(currentPalette.length)
          .map(() => 'UNANSWERED' as QuestionStatus);
        currentPalette = [...currentPalette, ...additionalPalette];
      }

      const newPalette = applyPaletteUpdate(
        currentPalette,
        state.currentQuestionIndex,
        startingQuestionIndex,
        state.answers,
        allQuestions,
      );

      return {
        testInstance: updatedTestInstance,
        questions: allQuestions,
        currentQuestionIndex: startingQuestionIndex,
        currentQuestion: allQuestions[startingQuestionIndex] || null,
        palette: newPalette,
      };
    });
  },

  saveAnswer: (questionId, answerData) => {
    set((state) => {
      const newAnswers = { ...state.answers };
      newAnswers[questionId] = {
        ...newAnswers[questionId],
        questionId,
        ...answerData,
        status:
          newAnswers[questionId]?.status === 'MARKED_FOR_REVIEW' ? 'MARKED_FOR_REVIEW' : 'ANSWERED',
      };

      return {
        answers: newAnswers,
        hasUnsavedChanges: true,
      };
    });
  },

  toggleReview: (questionId) => {
    set((state) => {
      const newAnswers = { ...state.answers };
      const current = newAnswers[questionId];
      if (current?.status === 'MARKED_FOR_REVIEW') {
        newAnswers[questionId] = {
          ...current,
          status:
            current.selectedOptionId ||
            (current.selectedOptionIds && current.selectedOptionIds.length > 0) ||
            current.textResponse
              ? 'ANSWERED'
              : 'UNANSWERED',
        };
      } else {
        newAnswers[questionId] = {
          ...current,
          questionId,
          status: 'MARKED_FOR_REVIEW',
        };
      }
      return { answers: newAnswers, hasUnsavedChanges: true };
    });
  },

  markForReview: (questionId) => {
    set((state) => {
      const newAnswers = { ...state.answers };
      const current = newAnswers[questionId];
      newAnswers[questionId] = {
        ...current,
        questionId,
        status: 'MARKED_FOR_REVIEW',
      };
      return { answers: newAnswers, hasUnsavedChanges: true };
    });
  },

  removeReview: (questionId) => {
    set((state) => {
      const newAnswers = { ...state.answers };
      const current = newAnswers[questionId];
      if (current) {
        newAnswers[questionId] = {
          ...current,
          status:
            current.selectedOptionId ||
            (current.selectedOptionIds && current.selectedOptionIds.length > 0) ||
            current.textResponse
              ? 'ANSWERED'
              : 'UNANSWERED',
        };
      }
      return { answers: newAnswers, hasUnsavedChanges: true };
    });
  },

  goNext: () => {
    const { currentQuestionIndex, questions, jumpToQuestion } = get();
    if (currentQuestionIndex < questions.length - 1) {
      jumpToQuestion(currentQuestionIndex + 1);
    }
  },

  goPrevious: () => {
    const { currentQuestionIndex, jumpToQuestion } = get();
    if (currentQuestionIndex > 0) {
      jumpToQuestion(currentQuestionIndex - 1);
    }
  },

  setTimer: (time: number) => set({ remainingTime: time }),
  setSectionTimer: (time: number) => set({ sectionRemainingTime: time }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),

  // Day 4 implementations
  setAutosaveStatus: (status) =>
    set({ autosaveStatus: status, ...(status === 'SAVED' ? { lastSavedAt: new Date() } : {}) }),
  setRecovered: (recovered) => set({ isRecovered: recovered }),
  setAttemptedResume: (attempted) => set({ hasAttemptedResume: attempted }),
  setSubmissionStatus: (status) => set({ submissionStatus: status }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setPing: (ping) => set({ ping }),
  setUnsavedChanges: (unsaved) => set({ hasUnsavedChanges: unsaved }),
}));
