/**
 * useKeyboardNavigation Hook (Story 8.3 - AC1, UX-P1-005)
 * WCAG 2.1.1 - Keyboard Navigation
 * 
 * Provides arrow key navigation for grid/list components.
 * Supports: Arrow keys, Home, End, Enter, Space
 */

import { useCallback, useState } from 'react';

interface UseKeyboardNavigationOptions<T> {
  /** Array of items to navigate */
  items: T[];
  /** Number of columns (for grid navigation) */
  columns?: number;
  /** Callback when item is activated (Enter/Space) */
  onActivate?: (item: T, index: number) => void;
  /** Initial focused index */
  initialIndex?: number;
  /** Whether navigation wraps around */
  wrap?: boolean;
}

interface KeyboardNavigationResult {
  /** Current focused index */
  focusedIndex: number;
  /** Set focused index programmatically */
  setFocusedIndex: (index: number) => void;
  /** Key handler to attach to container */
  handleKeyDown: (event: React.KeyboardEvent) => void;
  /** Get props for each item */
  getItemProps: (index: number) => {
    tabIndex: number;
    'aria-selected': boolean;
    onFocus: () => void;
  };
}

export function useKeyboardNavigation<T>({
  items,
  columns = 1,
  onActivate,
  initialIndex = 0,
  wrap = true,
}: UseKeyboardNavigationOptions<T>): KeyboardNavigationResult {
  const [focusedIndex, setFocusedIndex] = useState(initialIndex);

  const navigate = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right' | 'home' | 'end') => {
      const count = items.length;
      if (count === 0) return;

      let newIndex = focusedIndex;

      switch (direction) {
        case 'left':
          newIndex = focusedIndex - 1;
          break;
        case 'right':
          newIndex = focusedIndex + 1;
          break;
        case 'up':
          newIndex = focusedIndex - columns;
          break;
        case 'down':
          newIndex = focusedIndex + columns;
          break;
        case 'home':
          newIndex = 0;
          break;
        case 'end':
          newIndex = count - 1;
          break;
      }

      // Handle wrapping
      if (wrap) {
        if (newIndex < 0) newIndex = count - 1;
        if (newIndex >= count) newIndex = 0;
      } else {
        newIndex = Math.max(0, Math.min(count - 1, newIndex));
      }

      setFocusedIndex(newIndex);

      // Focus the element
      const element = document.querySelector(
        `[data-keyboard-nav-index="${newIndex}"]`
      ) as HTMLElement;
      if (element) {
        element.focus();
      }
    },
    [focusedIndex, items.length, columns, wrap]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const { key } = event;

      switch (key) {
        case 'ArrowLeft':
          event.preventDefault();
          navigate('left');
          break;
        case 'ArrowRight':
          event.preventDefault();
          navigate('right');
          break;
        case 'ArrowUp':
          event.preventDefault();
          navigate('up');
          break;
        case 'ArrowDown':
          event.preventDefault();
          navigate('down');
          break;
        case 'Home':
          event.preventDefault();
          navigate('home');
          break;
        case 'End':
          event.preventDefault();
          navigate('end');
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (onActivate && items[focusedIndex]) {
            onActivate(items[focusedIndex], focusedIndex);
          }
          break;
      }
    },
    [navigate, onActivate, items, focusedIndex]
  );

  const getItemProps = useCallback(
    (index: number) => ({
      tabIndex: index === focusedIndex ? 0 : -1,
      'aria-selected': index === focusedIndex,
      'data-keyboard-nav-index': index,
      onFocus: () => setFocusedIndex(index),
    }),
    [focusedIndex]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    getItemProps,
  };
}

export default useKeyboardNavigation;
