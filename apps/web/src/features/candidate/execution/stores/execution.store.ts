import { create } from 'zustand';
import { AnswerState, Question, QuestionStatus, TestInstance, AutosaveStatus, ConnectionStatus, SubmissionStatus } from '../types/execution.types';

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
  submissionStatus: SubmissionStatus;
  isRecovered: boolean;
  hasUnsavedChanges: boolean;

  // Actions
  initializeTest: (testInstance: TestInstance) => void;
  jumpToQuestion: (index: number) => void;
  saveAnswer: (questionId: string, optionId: string) => void;
  markForReview: (questionId: string) => void;
  removeReview: (questionId: string) => void;
  goNext: () => void;
  goPrevious: () => void;
  setTimer: (time: number) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  // Day 4 Actions
  setAutosaveStatus: (status: AutosaveStatus) => void;
  setRecovered: (recovered: boolean) => void;
  setSubmissionStatus: (status: SubmissionStatus) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setUnsavedChanges: (unsaved: boolean) => void;
  restoreStateFromStorage: (savedState: { answers: Record<string, AnswerState>; currentQuestionIndex: number; remainingTime: number }) => void;
}

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

  // Day 4 State
  autosaveStatus: 'IDLE',
  lastSavedAt: null,
  connectionStatus: 'ONLINE',
  submissionStatus: 'IDLE',
  isRecovered: false,
  hasUnsavedChanges: false,

  initializeTest: (testInstance) => {
    const allQuestions = testInstance.sections.flatMap(s => s.questions);
    const initialPalette = allQuestions.map((_, i) => i === 0 ? 'CURRENT' : 'UNANSWERED');

    set({
      testInstance,
      questions: allQuestions,
      currentQuestionIndex: 0,
      currentQuestion: allQuestions[0] || null,
      palette: initialPalette,
      remainingTime: testInstance.durationSeconds,
      answers: {},
      loading: false,
      error: null,
      isRecovered: false
    });
  },

  restoreStateFromStorage: (savedState) => {
    set((state) => {
      if (!state.testInstance) return state;

      const questions = state.questions;
      const initialPalette = questions.map((q, i) => {
        if (i === savedState.currentQuestionIndex) return 'CURRENT';
        const answer = savedState.answers[q.id];
        if (answer) {
          if (answer.status === 'MARKED_FOR_REVIEW') return 'MARKED_FOR_REVIEW';
          if (answer.selectedOptionId) return 'ANSWERED';
        }
        return 'UNANSWERED';
      });

      return {
        answers: savedState.answers,
        currentQuestionIndex: savedState.currentQuestionIndex,
        currentQuestion: questions[savedState.currentQuestionIndex],
        remainingTime: savedState.remainingTime,
        palette: initialPalette,
        isRecovered: true
      };
    });
  },

  jumpToQuestion: (index) => {
    const state = get();
    if (index < 0 || index >= state.questions.length) return;

    set((state) => {
      const newPalette = [...state.palette];
      
      const prevIndex = state.currentQuestionIndex;
      const prevQuestion = state.questions[prevIndex];
      if (prevQuestion) {
        const answer = state.answers[prevQuestion.id];
        if (answer?.status === 'MARKED_FOR_REVIEW') {
          newPalette[prevIndex] = 'MARKED_FOR_REVIEW';
        } else {
          const hasAnswer = !!answer?.selectedOptionId;
          newPalette[prevIndex] = hasAnswer ? 'ANSWERED' : 'UNANSWERED';
        }
      }

      newPalette[index] = 'CURRENT';

      return {
        currentQuestionIndex: index,
        currentQuestion: state.questions[index],
        palette: newPalette,
        hasUnsavedChanges: true
      };
    });
  },

  saveAnswer: (questionId, optionId) => {
    set((state) => {
      const newAnswers = { ...state.answers };
      newAnswers[questionId] = {
        questionId,
        selectedOptionId: optionId,
        status: newAnswers[questionId]?.status === 'MARKED_FOR_REVIEW' ? 'MARKED_FOR_REVIEW' : 'ANSWERED'
      };
      
      return { 
        answers: newAnswers,
        hasUnsavedChanges: true
      };
    });
  },

  markForReview: (questionId) => {
    set((state) => {
      const newAnswers = { ...state.answers };
      const current = newAnswers[questionId];
      newAnswers[questionId] = {
        questionId,
        selectedOptionId: current?.selectedOptionId,
        status: 'MARKED_FOR_REVIEW'
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
          status: current.selectedOptionId ? 'ANSWERED' : 'UNANSWERED'
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
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),

  // Day 4 implementations
  setAutosaveStatus: (status) => set({ autosaveStatus: status, ...(status === 'SAVED' ? { lastSavedAt: new Date() } : {}) }),
  setRecovered: (recovered) => set({ isRecovered: recovered }),
  setSubmissionStatus: (status) => set({ submissionStatus: status }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setUnsavedChanges: (unsaved) => set({ hasUnsavedChanges: unsaved }),
}));
