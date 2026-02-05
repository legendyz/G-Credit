/**
 * useMediaQuery Hook Tests - Story 8.5: Responsive Design
 *
 * Tests for media query detection hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useSupportsHover,
  useBreakpoint,
  BREAKPOINTS,
} from './useMediaQuery';

// Mock matchMedia
function createMatchMedia(matches: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('useMediaQuery', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns true when media query matches', () => {
    window.matchMedia = createMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('returns false when media query does not match', () => {
    window.matchMedia = createMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('updates when media query changes', () => {
    let listener: ((event: MediaQueryListEvent) => void) | null = null;
    
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn((_, cb) => { listener = cb; }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      if (listener) {
        listener({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(true);
  });
});

describe('useIsMobile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true for mobile viewport (< 768px)', () => {
    window.matchMedia = createMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('returns false for tablet/desktop viewport (>= 768px)', () => {
    window.matchMedia = createMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });
});

describe('useIsTablet', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true for tablet viewport (768px - 1023px)', () => {
    window.matchMedia = createMatchMedia(true);
    const { result } = renderHook(() => useIsTablet());
    expect(result.current).toBe(true);
  });
});

describe('useIsDesktop', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true for desktop viewport (>= 1024px)', () => {
    window.matchMedia = createMatchMedia(true);
    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(true);
  });

  it('returns false for mobile/tablet viewport (< 1024px)', () => {
    window.matchMedia = createMatchMedia(false);
    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(false);
  });
});

describe('useSupportsHover', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true for devices with hover capability', () => {
    window.matchMedia = createMatchMedia(true);
    const { result } = renderHook(() => useSupportsHover());
    expect(result.current).toBe(true);
  });

  it('returns false for touch-only devices', () => {
    window.matchMedia = createMatchMedia(false);
    const { result } = renderHook(() => useSupportsHover());
    expect(result.current).toBe(false);
  });
});

describe('useBreakpoint', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns correct breakpoint name based on viewport', () => {
    // Mock for xs (all queries return false)
    window.matchMedia = createMatchMedia(false);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('xs');
  });
});

describe('BREAKPOINTS constant', () => {
  it('contains correct Tailwind breakpoint values', () => {
    expect(BREAKPOINTS.sm).toBe(640);
    expect(BREAKPOINTS.md).toBe(768);
    expect(BREAKPOINTS.lg).toBe(1024);
    expect(BREAKPOINTS.xl).toBe(1280);
    expect(BREAKPOINTS['2xl']).toBe(1536);
  });
});
