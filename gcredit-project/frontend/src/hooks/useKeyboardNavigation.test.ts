/**
 * useKeyboardNavigation Hook Tests (Story 8.3 - AC1, UX-P1-005)
 * WCAG 2.1.1 - Keyboard Navigation
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardNavigation } from './useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  const mockItems = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
    { id: '4', name: 'Item 4' },
    { id: '5', name: 'Item 5' },
    { id: '6', name: 'Item 6' },
  ];

  it('should initialize with focusedIndex at 0', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ items: mockItems }));

    expect(result.current.focusedIndex).toBe(0);
  });

  it('should initialize with custom initialIndex', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ items: mockItems, initialIndex: 3 })
    );

    expect(result.current.focusedIndex).toBe(3);
  });

  it('should navigate right with ArrowRight key', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ items: mockItems }));

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowRight',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.focusedIndex).toBe(1);
  });

  it('should navigate left with ArrowLeft key', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ items: mockItems, initialIndex: 2 })
    );

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowLeft',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.focusedIndex).toBe(1);
  });

  it('should navigate down with ArrowDown key in grid', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ items: mockItems, columns: 3 }));

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.focusedIndex).toBe(3); // Jump 3 columns down
  });

  it('should navigate up with ArrowUp key in grid', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ items: mockItems, columns: 3, initialIndex: 4 })
    );

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowUp',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.focusedIndex).toBe(1); // Jump 3 columns up
  });

  it('should jump to first item with Home key', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ items: mockItems, initialIndex: 4 })
    );

    act(() => {
      result.current.handleKeyDown({
        key: 'Home',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.focusedIndex).toBe(0);
  });

  it('should jump to last item with End key', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ items: mockItems }));

    act(() => {
      result.current.handleKeyDown({
        key: 'End',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.focusedIndex).toBe(5);
  });

  it('should wrap around when at start with ArrowLeft', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ items: mockItems, wrap: true }));

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowLeft',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.focusedIndex).toBe(5); // Wrapped to last
  });

  it('should wrap around when at end with ArrowRight', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ items: mockItems, initialIndex: 5, wrap: true })
    );

    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowRight',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.focusedIndex).toBe(0); // Wrapped to first
  });

  it('should call onActivate when Enter is pressed', () => {
    const onActivate = vi.fn();
    const { result } = renderHook(() => useKeyboardNavigation({ items: mockItems, onActivate }));

    act(() => {
      result.current.handleKeyDown({
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(onActivate).toHaveBeenCalledWith(mockItems[0], 0);
  });

  it('should call onActivate when Space is pressed', () => {
    const onActivate = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({ items: mockItems, initialIndex: 2, onActivate })
    );

    act(() => {
      result.current.handleKeyDown({
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(onActivate).toHaveBeenCalledWith(mockItems[2], 2);
  });

  it('should return correct item props', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ items: mockItems }));

    const props0 = result.current.getItemProps(0);
    const props1 = result.current.getItemProps(1);

    expect(props0.tabIndex).toBe(0); // Focused item
    expect(props0['aria-selected']).toBe(true);

    expect(props1.tabIndex).toBe(-1); // Non-focused item
    expect(props1['aria-selected']).toBe(false);
  });

  it('should update focusedIndex on item focus', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ items: mockItems }));

    const props2 = result.current.getItemProps(2);

    act(() => {
      props2.onFocus();
    });

    expect(result.current.focusedIndex).toBe(2);
  });

  it('should handle empty items array', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ items: [] }));

    // Should not throw
    act(() => {
      result.current.handleKeyDown({
        key: 'ArrowRight',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.focusedIndex).toBe(0);
  });
});
