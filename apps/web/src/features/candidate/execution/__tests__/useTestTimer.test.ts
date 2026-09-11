import { renderHook, act } from '@testing-library/react';
import { useExecutionStore } from '../stores/execution.store';
import { useTestTimer } from '../hooks/useTestTimer';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../stores/execution.store');

describe('useTestTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (useExecutionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      remainingTime: 3600,
      sectionRemainingTime: 3600,
      sectionTimingEnabled: false,
      setTimer: vi.fn(),
      setSectionTimer: vi.fn(),
      hasAttemptedResume: true,
      loading: false,
      testInstance: { id: 'test-1', durationSeconds: 3600 },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('formats time correctly', () => {
    const { result } = renderHook(() => useTestTimer());
    expect(result.current.formattedTime).toBe('01:00:00');
    expect(result.current.isReady).toBe(true);
  });

  it('updates remaining time', () => {
    const setTimerMock = vi.fn();
    (useExecutionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      remainingTime: 60,
      sectionRemainingTime: 60,
      sectionTimingEnabled: false,
      setTimer: setTimerMock,
      hasAttemptedResume: true,
      loading: false,
      testInstance: { id: 'test-1', durationSeconds: 60 },
    });

    renderHook(() => useTestTimer());

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(setTimerMock).toHaveBeenCalledWith(59);
  });

  it('handles warning state', () => {
    (useExecutionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      remainingTime: 300,
      sectionRemainingTime: 300,
      sectionTimingEnabled: false,
      setTimer: vi.fn(),
      hasAttemptedResume: true,
      loading: false,
      testInstance: { id: 'test-1', durationSeconds: 300 },
    });

    const { result } = renderHook(() => useTestTimer());
    expect(result.current.isWarning).toBe(true);
  });

  it('safely handles unhydrated / loading state without crashing', () => {
    (useExecutionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      remainingTime: 0,
      sectionRemainingTime: 0,
      sectionTimingEnabled: false,
      setTimer: vi.fn(),
      hasAttemptedResume: false,
      loading: true,
      testInstance: null,
    });

    const { result } = renderHook(() => useTestTimer());
    expect(result.current.isReady).toBe(false);
    expect(result.current.formattedTime).toBe('00:00');
    expect(result.current.isWarning).toBe(false);
  });

  it('safely handles undefined / NaN timer state without crashing', () => {
    (useExecutionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      remainingTime: undefined,
      sectionRemainingTime: NaN,
      sectionTimingEnabled: true,
      setTimer: vi.fn(),
      hasAttemptedResume: true,
      loading: false,
      testInstance: { id: 'test-1', durationSeconds: 3600 },
    });

    const { result } = renderHook(() => useTestTimer());
    expect(result.current.isReady).toBe(true);
    expect(result.current.formattedTime).toBe('00:00');
    expect(result.current.remainingTime).toBe(0);
  });

  it('accurately synchronizes remaining time from authoritative expiresAt', () => {
    const setTimerMock = vi.fn();
    const now = Date.now();
    // 38 minutes (2280 seconds) remaining until expiresAt
    const expiresAt = new Date(now + 2280 * 1000).toISOString();

    (useExecutionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      remainingTime: 7200,
      sectionRemainingTime: 7200,
      sectionTimingEnabled: false,
      setTimer: setTimerMock,
      hasAttemptedResume: true,
      loading: false,
      serverClockOffsetMs: 0,
      testInstance: { id: 'test-wall-clock', durationSeconds: 7200, expiresAt },
    });

    renderHook(() => useTestTimer());

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // After 1s, exactly 2279 seconds should be calculated
    expect(setTimerMock).toHaveBeenCalledWith(2279);
  });

  it('accurately advances by wall-clock time even after multi-second delay or tab throttle', () => {
    const setTimerMock = vi.fn();
    (useExecutionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      remainingTime: 100,
      sectionRemainingTime: 100,
      sectionTimingEnabled: false,
      setTimer: setTimerMock,
      hasAttemptedResume: true,
      loading: false,
      testInstance: { id: 'test-anchor', durationSeconds: 100 },
    });

    renderHook(() => useTestTimer());

    act(() => {
      // Advance by 15 seconds at once (simulating tab throttle / background lag)
      vi.advanceTimersByTime(15000);
    });

    // Wall-clock anchor accounts for full 15s elapsed
    expect(setTimerMock).toHaveBeenCalledWith(85);
  });
});

