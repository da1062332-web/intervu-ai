import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSessionRecovery } from '../hooks/useSessionRecovery';
import { useExecutionStore } from '../stores/execution.store';
import { useTestSessionStore } from '@/modules/session/stores/test-session.store';

vi.mock('../stores/execution.store', () => ({
  useExecutionStore: vi.fn(),
}));

vi.mock('@/modules/session/stores/test-session.store', () => ({
  useTestSessionStore: vi.fn(),
}));

describe('useSessionRecovery', () => {
  const mockRestoreStateFromStorage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useExecutionStore as any).mockReturnValue({
      testInstance: { id: 'test-1', durationSeconds: 3600 },
      restoreStateFromStorage: mockRestoreStateFromStorage,
    });
  });

  it('recovers state if session is active', () => {
    (useTestSessionStore as any).mockReturnValue({
      sessionId: 'sess-1',
      status: 'ACTIVE',
    });

    const mockSavedData = JSON.stringify({
      answers: { q1: { status: 'ANSWERED' } },
      currentQuestionIndex: 2,
      remainingTime: 3000,
    });

    Storage.prototype.getItem = vi.fn(() => mockSavedData);

    renderHook(() => useSessionRecovery('test-1'));

    expect(mockRestoreStateFromStorage).toHaveBeenCalledWith({
      answers: { q1: { status: 'ANSWERED' } },
      currentQuestionIndex: 2,
      remainingTime: 3000,
    });
  });

  it('does not recover if session is EXPIRED', () => {
    (useTestSessionStore as any).mockReturnValue({
      sessionId: 'sess-1',
      status: 'EXPIRED',
    });

    renderHook(() => useSessionRecovery('test-1'));

    expect(mockRestoreStateFromStorage).not.toHaveBeenCalled();
  });
});
