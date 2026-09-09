import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOfflineRecovery } from '../hooks/useOfflineRecovery';
import { useExecutionStore } from '../stores/execution.store';
import { useAuthStore } from '@/store/auth.store';

vi.mock('../stores/execution.store', () => ({
  useExecutionStore: vi.fn(),
}));

vi.mock('@/store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../services/execution.service', () => ({
  executionService: {
    saveAnswer: vi.fn(),
  },
}));

describe('useOfflineRecovery', () => {
  const mockSetConnectionStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useExecutionStore as any).mockReturnValue({
      connectionStatus: 'ONLINE',
      setConnectionStatus: mockSetConnectionStatus,
    });

    (useAuthStore as any).mockImplementation((selector: any) => {
      return selector({ user: { id: 'user-1' }, status: 'authenticated' });
    });

    // Mock indexedDB for basic test execution
    const mockIDBRequest = {
      result: {
        objectStoreNames: { contains: () => true },
        transaction: () => ({
          objectStore: () => ({
            add: vi.fn(),
            getAll: () => ({
              onsuccess: null,
              result: [],
            }),
            delete: vi.fn(),
          }),
          // Automatically trigger oncomplete synchronously in the mock
          get oncomplete() {
            return undefined;
          },
          set oncomplete(cb: any) {
            if (cb) setTimeout(cb, 0);
          },
          onerror: null,
        }),
      },
      onerror: null,
      onsuccess: null,
      onupgradeneeded: null,
    };

    global.indexedDB = {
      open: vi.fn(() => {
        setTimeout(() => {
          if ((mockIDBRequest as any).onsuccess) {
            (mockIDBRequest as any).onsuccess({ target: mockIDBRequest });
          }
        }, 0);
        return mockIDBRequest as any;
      }),
    } as any;
  });

  it('queues operations when called', async () => {
    const { result } = renderHook(() => useOfflineRecovery());

    await act(async () => {
      await result.current.queueOperation('SAVE_ANSWER', {
        testId: 'test-1',
        questionId: 'q1',
        answer: 'opt1',
        timeSpentSeconds: 0,
        isMarkedForReview: false,
      });
    });

    expect(global.indexedDB.open).toHaveBeenCalledWith('SkillitriXOfflineDB', 1);
  });

  it('does not queue operations when user is not authenticated', async () => {
    (useAuthStore as any).mockImplementation((selector: any) => {
      return selector({ user: null, status: 'unauthenticated' });
    });

    const { result } = renderHook(() => useOfflineRecovery());

    await act(async () => {
      await result.current.queueOperation('SAVE_ANSWER', {
        testId: 'test-1',
        questionId: 'q2',
        answer: 'opt2',
        timeSpentSeconds: 0,
        isMarkedForReview: false,
      });
    });

    // open shouldn't be called if userId is missing
    expect(global.indexedDB.open).not.toHaveBeenCalled();
  });

  it('filters out operations belonging to different users during replay', async () => {
    // Current user is user-2
    (useAuthStore as any).mockImplementation((selector: any) => {
      return selector({ user: { id: 'user-2' }, status: 'authenticated' });
    });

    // Mock indexedDB to return operations for user-1
    const mockGetAll = vi.fn().mockImplementation(() => {
      const req: any = { result: [{ id: 'op1', userId: 'user-1', timestamp: 123 }] };
      setTimeout(() => req.onsuccess(), 0);
      return req;
    });

    const mockIDBRequest = {
      result: {
        objectStoreNames: { contains: () => true },
        transaction: () => ({
          objectStore: () => ({
            add: vi.fn(),
            getAll: mockGetAll,
            delete: vi.fn(),
          }),
          get oncomplete() { return undefined; },
          set oncomplete(cb: any) { if (cb) setTimeout(cb, 0); },
          onerror: null,
        }),
      },
    };
    (global.indexedDB.open as any).mockImplementation(() => {
      setTimeout(() => { (mockIDBRequest as any).onsuccess({ target: mockIDBRequest }); }, 0);
      return mockIDBRequest;
    });

    const { result } = renderHook(() => useOfflineRecovery());

    await act(async () => {
      await result.current.replayQueue();
    });

    // We shouldn't call executionService because no ops belong to user-2
    const { executionService } = await import('../services/execution.service');
    expect(executionService.saveAnswer).not.toHaveBeenCalled();
  });
});
