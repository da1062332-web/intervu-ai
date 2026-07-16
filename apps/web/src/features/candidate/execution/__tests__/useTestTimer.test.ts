import { renderHook, act } from '@testing-library/react';
import { useExecutionStore } from '../stores/execution.store';
import { useTestTimer } from '../hooks/useTestTimer';

jest.mock('../stores/execution.store');

describe('useTestTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (useExecutionStore as unknown as jest.Mock).mockReturnValue({
      remainingTime: 3600,
      sectionRemainingTime: 3600,
      sectionTimingEnabled: false,
      setTimer: jest.fn(),
      setSectionTimer: jest.fn(),
      hasAttemptedResume: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('formats time correctly', () => {
    const { result } = renderHook(() => useTestTimer());
    expect(result.current.formattedTime).toBe('01:00:00');
  });

  it('updates remaining time', () => {
    const setTimerMock = jest.fn();
    (useExecutionStore as unknown as jest.Mock).mockReturnValue({
      remainingTime: 60,
      sectionRemainingTime: 60,
      sectionTimingEnabled: false,
      setTimer: setTimerMock,
      hasAttemptedResume: true,
    });

    renderHook(() => useTestTimer());

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(setTimerMock).toHaveBeenCalledWith(59);
  });

  it('handles warning state', () => {
    (useExecutionStore as unknown as jest.Mock).mockReturnValue({
      remainingTime: 300,
      sectionRemainingTime: 300,
      sectionTimingEnabled: false,
      setTimer: jest.fn(),
      hasAttemptedResume: true,
    });

    const { result } = renderHook(() => useTestTimer());
    expect(result.current.isWarning).toBe(true);
  });
});
