import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOfflineRecovery } from '../hooks/useOfflineRecovery';
import { useExecutionStore } from '../stores/execution.store';

vi.mock('../stores/execution.store', () => ({
  useExecutionStore: vi.fn(),
}));

describe('useOfflineRecovery', () => {
  const mockSetConnectionStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useExecutionStore as any).mockReturnValue({
      connectionStatus: 'ONLINE',
      setConnectionStatus: mockSetConnectionStatus,
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
      await result.current.queueOperation('SAVE_ANSWER', { q1: 'opt1' });
    });

    expect(global.indexedDB.open).toHaveBeenCalledWith('IntervuOfflineDB', 1);
  });
});
