/**
 * useFocusTrap Hook (Story 8.3 - AC1)
 * WCAG 2.4.3 - Focus Order
 * 
 * Traps focus within a container (modal, dialog) for keyboard accessibility.
 * When Tab reaches the last focusable element, it wraps to the first.
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseFocusTrapOptions {
  /** Whether the trap is active */
  isActive: boolean;
  /** Callback when Escape is pressed */
  onEscape?: () => void;
  /** Element to return focus to when trap is deactivated */
  returnFocusTo?: HTMLElement | null;
  /** Auto-focus first element when activated */
  autoFocus?: boolean;
}

// Selector for all focusable elements
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

export function useFocusTrap<T extends HTMLElement>({
  isActive,
  onEscape,
  returnFocusTo,
  autoFocus = true,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((el) => {
      // Filter out invisible elements
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }, []);

  // Handle keydown for Tab and Escape
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isActive || !containerRef.current) return;

      // Handle Escape key
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      // Handle Tab key
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        // Shift+Tab from first element -> wrap to last
        if (event.shiftKey && activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
          return;
        }

        // Tab from last element -> wrap to first
        if (!event.shiftKey && activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
          return;
        }
      }
    },
    [isActive, onEscape, getFocusableElements]
  );

  // Activate trap
  useEffect(() => {
    if (isActive) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Auto-focus first element
      if (autoFocus) {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          // Small delay to ensure DOM is ready
          requestAnimationFrame(() => {
            focusableElements[0].focus();
          });
        }
      }

      // Add keydown listener
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, autoFocus, handleKeyDown, getFocusableElements]);

  // Return focus when deactivated
  useEffect(() => {
    if (!isActive && previousActiveElement.current) {
      const elementToFocus = returnFocusTo || previousActiveElement.current;
      if (elementToFocus && typeof elementToFocus.focus === 'function') {
        elementToFocus.focus();
      }
      previousActiveElement.current = null;
    }
  }, [isActive, returnFocusTo]);

  return containerRef;
}

export default useFocusTrap;
