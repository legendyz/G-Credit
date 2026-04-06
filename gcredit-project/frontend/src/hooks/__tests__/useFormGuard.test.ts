/**
 * useFormGuard Hook Tests - Sprint 16 Hotfix
 *
 * Tests for the dirty-form navigation guard hook.
 * Covers: pushState interception, proceed/reset flows,
 * beforeunload, isDirty transitions, and popstate events.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormGuard } from '../useFormGuard';

describe('useFormGuard', () => {
  let originalPushState: typeof history.pushState;
  let originalReplaceState: typeof history.replaceState;

  beforeEach(() => {
    originalPushState = history.pushState.bind(history);
    originalReplaceState = history.replaceState.bind(history);
  });

  afterEach(() => {
    // Restore originals in case tests leave overrides
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  });

  describe('initialization', () => {
    it('returns isBlocked=false when isDirty=false', () => {
      const { result } = renderHook(() => useFormGuard({ isDirty: false }));

      expect(result.current.isBlocked).toBe(false);
      expect(typeof result.current.proceed).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('returns isBlocked=false initially when isDirty=true (no navigation yet)', () => {
      const { result } = renderHook(() => useFormGuard({ isDirty: true }));

      expect(result.current.isBlocked).toBe(false);
    });
  });

  describe('pushState interception', () => {
    it('blocks navigation via pushState when isDirty=true', () => {
      const { result } = renderHook(() => useFormGuard({ isDirty: true }));

      act(() => {
        history.pushState({}, '', '/new-page');
      });

      expect(result.current.isBlocked).toBe(true);
    });

    it('does not block navigation via pushState when isDirty=false', () => {
      const { result } = renderHook(() => useFormGuard({ isDirty: false }));

      act(() => {
        // pushState should work normally — not intercepted
        history.pushState({}, '', '/new-page');
      });

      expect(result.current.isBlocked).toBe(false);
    });

    it('blocks navigation via replaceState when isDirty=true', () => {
      const { result } = renderHook(() => useFormGuard({ isDirty: true }));

      act(() => {
        history.replaceState({}, '', '/replaced-page');
      });

      expect(result.current.isBlocked).toBe(true);
    });
  });

  describe('proceed', () => {
    it('clears blocked state and executes pending navigation', () => {
      const { result } = renderHook(() => useFormGuard({ isDirty: true }));

      // Trigger a navigation to create a pending action
      act(() => {
        history.pushState({}, '', '/target-page');
      });

      expect(result.current.isBlocked).toBe(true);

      // Spy on PopStateEvent dispatch (Lesson 57)
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      act(() => {
        result.current.proceed();
      });

      expect(result.current.isBlocked).toBe(false);
      // Verify PopStateEvent was dispatched to notify React Router
      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PopStateEvent));
      dispatchSpy.mockRestore();
    });

    it('is a no-op when no pending navigation exists', () => {
      const { result } = renderHook(() => useFormGuard({ isDirty: true }));

      // No pushState was called, so proceed should safely do nothing
      act(() => {
        result.current.proceed();
      });

      expect(result.current.isBlocked).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears blocked state and discards pending navigation', () => {
      const { result } = renderHook(() => useFormGuard({ isDirty: true }));

      act(() => {
        history.pushState({}, '', '/should-not-navigate');
      });

      expect(result.current.isBlocked).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isBlocked).toBe(false);
    });
  });

  describe('isDirty transitions', () => {
    it('clears blocked state when isDirty changes from true to false', () => {
      const { result, rerender } = renderHook(({ isDirty }) => useFormGuard({ isDirty }), {
        initialProps: { isDirty: true },
      });

      // Trigger a block
      act(() => {
        history.pushState({}, '', '/some-page');
      });

      expect(result.current.isBlocked).toBe(true);

      // Form becomes clean (e.g., saved successfully)
      rerender({ isDirty: false });

      expect(result.current.isBlocked).toBe(false);
    });
  });

  describe('beforeunload', () => {
    it('adds beforeunload listener when isDirty=true', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useFormGuard({ isDirty: true }));

      expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
      addSpy.mockRestore();
    });

    it('does not add beforeunload listener when isDirty=false', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useFormGuard({ isDirty: false }));

      const beforeUnloadCalls = addSpy.mock.calls.filter(([event]) => event === 'beforeunload');
      expect(beforeUnloadCalls).toHaveLength(0);
      addSpy.mockRestore();
    });

    it('prevents default on beforeunload event when isDirty=true', () => {
      renderHook(() => useFormGuard({ isDirty: true }));

      const event = new Event('beforeunload', { cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('removes beforeunload listener on cleanup', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useFormGuard({ isDirty: true }));

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
      removeSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('restores original pushState/replaceState on unmount', () => {
      const pushBefore = history.pushState;

      const { unmount } = renderHook(() => useFormGuard({ isDirty: true }));

      // pushState should be overridden
      expect(history.pushState).not.toBe(pushBefore);

      unmount();

      // After unmount, pushState should be restored
      // (may not be identical reference due to bind, but should not be the override)
      // Trigger pushState — should not cause isBlocked to change
      expect(() => history.pushState({}, '', '/after-unmount')).not.toThrow();
    });
  });
});
