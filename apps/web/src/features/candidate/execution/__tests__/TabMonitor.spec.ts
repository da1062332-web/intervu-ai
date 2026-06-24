import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTabMonitor } from '../hooks/useTabMonitor';
import { eventTracker } from '../services/test-event-tracker';

vi.mock('../services/test-event-tracker', () => ({
  eventTracker: {
    track: vi.fn(),
  },
}));

describe('useTabMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes correctly', () => {
    const { result } = renderHook(() => useTabMonitor());
    expect(result.current.tabHiddenCount).toBe(0);
    expect(result.current.showWarning).toBe(false);
  });

  it('tracks tab hidden and updates state', () => {
    const { result } = renderHook(() => useTabMonitor());

    act(() => {
      Object.defineProperty(document, 'hidden', { value: true, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.tabHiddenCount).toBe(1);
    expect(result.current.showWarning).toBe(true);
    expect(eventTracker.track).toHaveBeenCalledWith('TAB_HIDDEN');
  });

  it('tracks tab visible', () => {
    renderHook(() => useTabMonitor());

    act(() => {
      Object.defineProperty(document, 'hidden', { value: false, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(eventTracker.track).toHaveBeenCalledWith('TAB_VISIBLE');
  });

  it('dismisses warning', () => {
    const { result } = renderHook(() => useTabMonitor());

    act(() => {
      Object.defineProperty(document, 'hidden', { value: true, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.showWarning).toBe(true);

    act(() => {
      result.current.dismissWarning();
    });

    expect(result.current.showWarning).toBe(false);
  });
});
