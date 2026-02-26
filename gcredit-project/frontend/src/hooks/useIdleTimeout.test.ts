import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIdleTimeout } from './useIdleTimeout';

describe('useIdleTimeout', () => {
  const onTimeout = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    onTimeout.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not start when enabled=false', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');

    const { result } = renderHook(() =>
      useIdleTimeout({
        timeout: 10_000,
        warningBefore: 3_000,
        onTimeout,
        enabled: false,
      })
    );

    expect(result.current.isWarning).toBe(false);
    expect(result.current.secondsRemaining).toBe(0);
    // No activity event listeners should be registered
    const activityCalls = addSpy.mock.calls.filter(([event]) =>
      ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].includes(event as string)
    );
    expect(activityCalls).toHaveLength(0);

    addSpy.mockRestore();
  });

  it('starts timer when enabled=true', () => {
    const { result } = renderHook(() =>
      useIdleTimeout({
        timeout: 10_000,
        warningBefore: 3_000,
        onTimeout,
        enabled: true,
      })
    );

    expect(result.current.isWarning).toBe(false);
    expect(result.current.secondsRemaining).toBe(0);
  });

  it('fires warning at timeout - warningBefore', () => {
    const { result } = renderHook(() =>
      useIdleTimeout({
        timeout: 10_000,
        warningBefore: 3_000,
        onTimeout,
        enabled: true,
      })
    );

    // Advance to 7 seconds (warning threshold)
    act(() => {
      vi.advanceTimersByTime(7_000);
    });

    expect(result.current.isWarning).toBe(true);
    expect(result.current.secondsRemaining).toBe(3);
  });

  it('countdown decrements every second after warning', () => {
    const { result } = renderHook(() =>
      useIdleTimeout({
        timeout: 10_000,
        warningBefore: 3_000,
        onTimeout,
        enabled: true,
      })
    );

    // Advance to warning threshold + 1s
    act(() => {
      vi.advanceTimersByTime(8_000);
    });

    expect(result.current.isWarning).toBe(true);
    expect(result.current.secondsRemaining).toBe(2);
  });

  it('fires onTimeout at full timeout', () => {
    renderHook(() =>
      useIdleTimeout({
        timeout: 10_000,
        warningBefore: 3_000,
        onTimeout,
        enabled: true,
      })
    );

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('activity event resets the timer', () => {
    const { result } = renderHook(() =>
      useIdleTimeout({
        timeout: 10_000,
        warningBefore: 3_000,
        onTimeout,
        enabled: true,
      })
    );

    // Advance 5s (not yet warning)
    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    // Simulate user activity
    act(() => {
      document.dispatchEvent(new Event('mousemove'));
    });

    // Advance another 5s — should NOT trigger warning since timer was reset at 5s
    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(result.current.isWarning).toBe(false);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('resetTimer() dismisses warning and resets', () => {
    const { result } = renderHook(() =>
      useIdleTimeout({
        timeout: 10_000,
        warningBefore: 3_000,
        onTimeout,
        enabled: true,
      })
    );

    // Advance to warning
    act(() => {
      vi.advanceTimersByTime(7_000);
    });

    expect(result.current.isWarning).toBe(true);

    // Call resetTimer
    act(() => {
      result.current.resetTimer();
    });

    expect(result.current.isWarning).toBe(false);
    expect(result.current.secondsRemaining).toBe(0);

    // Advance 7s more — should trigger warning again (from new baseline)
    act(() => {
      vi.advanceTimersByTime(7_000);
    });

    expect(result.current.isWarning).toBe(true);
  });

  it('cleanup removes listeners on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useIdleTimeout({
        timeout: 10_000,
        warningBefore: 3_000,
        onTimeout,
        enabled: true,
      })
    );

    unmount();

    const removedEvents = removeSpy.mock.calls.map(([event]) => event);
    expect(removedEvents).toContain('mousemove');
    expect(removedEvents).toContain('keydown');
    expect(removedEvents).toContain('click');
    expect(removedEvents).toContain('scroll');
    expect(removedEvents).toContain('touchstart');
    expect(removedEvents).toContain('visibilitychange');

    removeSpy.mockRestore();
  });

  it('cleanup removes listeners when enabled changes to false', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useIdleTimeout({
          timeout: 10_000,
          warningBefore: 3_000,
          onTimeout,
          enabled,
        }),
      { initialProps: { enabled: true } }
    );

    rerender({ enabled: false });

    const removedEvents = removeSpy.mock.calls.map(([event]) => event);
    expect(removedEvents).toContain('mousemove');
    expect(removedEvents).toContain('visibilitychange');

    removeSpy.mockRestore();
  });
});
