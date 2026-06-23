import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTestTimer } from '../hooks/useTestTimer';
import { useExecutionStore } from '../stores/execution.store';

vi.mock('../stores/execution.store', () => ({
  useExecutionStore: vi.fn(),
}));

describe('useTestTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('formats time correctly', () => {
    (useExecutionStore as any).mockReturnValue({
      remainingTime: 3665, // 1h 1m 5s
      setTimer: vi.fn(),
    });

    const { result } = renderHook(() => useTestTimer());
    expect(result.current.formattedTime).toBe('01:01:05');
  });

  it('formats time under an hour correctly', () => {
    (useExecutionStore as any).mockReturnValue({
      remainingTime: 599, // 9m 59s
      setTimer: vi.fn(),
    });

    const { result } = renderHook(() => useTestTimer());
    expect(result.current.formattedTime).toBe('09:59');
  });

  it('sets isWarning to true when under 10 minutes', () => {
    (useExecutionStore as any).mockReturnValue({
      remainingTime: 599,
      setTimer: vi.fn(),
    });

    const { result } = renderHook(() => useTestTimer());
    expect(result.current.isWarning).toBe(true);
  });

  it('sets isWarning to false when over 10 minutes', () => {
    (useExecutionStore as any).mockReturnValue({
      remainingTime: 601,
      setTimer: vi.fn(),
    });

    const { result } = renderHook(() => useTestTimer());
    expect(result.current.isWarning).toBe(false);
  });
});
