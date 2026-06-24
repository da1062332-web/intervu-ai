import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface TestSessionState {
  sessionId: string;
  testId: string;
  startedAt: string;
  expiresAt: string;
  currentSection: string;
  currentQuestion: number;
  status: 'CREATED' | 'ACTIVE' | 'PAUSED' | 'SUBMITTED' | 'EXPIRED';

  // Actions
  initializeSession: (payload: {
    sessionId: string;
    testId: string;
    startedAt: string;
    expiresAt: string;
    currentSection: string;
  }) => void;
  updateSessionStatus: (status: TestSessionState['status']) => void;
  updateCurrentProgress: (section: string, question: number) => void;
  clearSession: () => void;
}

export const useTestSessionStore = create<TestSessionState>()(
  persist(
    (set) => ({
      sessionId: '',
      testId: '',
      startedAt: '',
      expiresAt: '',
      currentSection: '',
      currentQuestion: 0,
      status: 'CREATED',

      initializeSession: (payload) =>
        set({
          sessionId: payload.sessionId,
          testId: payload.testId,
          startedAt: payload.startedAt,
          expiresAt: payload.expiresAt,
          currentSection: payload.currentSection,
          currentQuestion: 0,
          status: 'ACTIVE',
        }),

      updateSessionStatus: (status) => set({ status }),

      updateCurrentProgress: (currentSection, currentQuestion) =>
        set({ currentSection, currentQuestion }),

      clearSession: () =>
        set({
          sessionId: '',
          testId: '',
          startedAt: '',
          expiresAt: '',
          currentSection: '',
          currentQuestion: 0,
          status: 'CREATED',
        }),
    }),
    {
      name: 'test-session-storage',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
