import { create } from 'zustand';
import { AnswerState, Question, QuestionStatus, TestInstance } from '../types/execution.types';

interface ExecutionState {
  // Data
  testInstance: TestInstance | null;
  questions: Question[]; // Flattened questions for easier access
  
  // State
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  answers: Record<string, AnswerState>;
  palette: QuestionStatus[];
  remainingTime: number;
  loading: boolean;
  error: string | null;

  // Actions
  initializeTest: (testInstance: TestInstance) => void;
  jumpToQuestion: (index: number) => void;
  saveAnswer: (questionId: string, optionId: string) => void;
  goNext: () => void;
  goPrevious: () => void;
  setTimer: (time: number) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
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

  initializeTest: (testInstance) => {
    // Flatten all questions across sections for this specific prototype logic
    // (Assuming simple sequential test flow without strict section locking for now)
    const allQuestions = testInstance.sections.flatMap(s => s.questions);
    
    // Initialize palette
    const initialPalette = allQuestions.map((_, i) => 
      i === 0 ? 'CURRENT' : 'UNANSWERED'
    );

    set({
      testInstance,
      questions: allQuestions,
      currentQuestionIndex: 0,
      currentQuestion: allQuestions[0] || null,
      palette: initialPalette,
      remainingTime: testInstance.durationSeconds,
      answers: {},
      loading: false,
      error: null
    });
  },

  jumpToQuestion: (index) => {
    const state = get();
    if (index < 0 || index >= state.questions.length) return;

    set((state) => {
      const newPalette = [...state.palette];
      
      // Update previous current question status
      const prevIndex = state.currentQuestionIndex;
      const prevQuestion = state.questions[prevIndex];
      if (prevQuestion) {
        const hasAnswer = !!state.answers[prevQuestion.id];
        newPalette[prevIndex] = hasAnswer ? 'ANSWERED' : 'UNANSWERED';
      }

      // Update new current question status
      newPalette[index] = 'CURRENT';

      return {
        currentQuestionIndex: index,
        currentQuestion: state.questions[index],
        palette: newPalette
      };
    });
  },

  saveAnswer: (questionId, optionId) => {
    set((state) => {
      const newAnswers = { ...state.answers };
      newAnswers[questionId] = {
        questionId,
        selectedOptionId: optionId,
        status: 'ANSWERED'
      };

      // Since we don't automatically jump on select, we just keep current as CURRENT in palette.
      // But we have saved the answer. The next time we navigate away, it will become ANSWERED.
      
      return { answers: newAnswers };
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

  setTimer: (time: number) => {
    set({ remainingTime: time });
  },

  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),
}));
