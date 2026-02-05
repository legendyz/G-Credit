/**
 * Skip Link Component (Story 8.3 - AC5)
 * WCAG 2.4.1 - Bypass Blocks
 * 
 * Provides keyboard users a way to skip repetitive navigation
 * and jump directly to main content.
 */

import { useCallback } from 'react';

interface SkipLinkProps {
  /** Target element ID (without #) */
  targetId?: string;
  /** Link text */
  children?: React.ReactNode;
}

export function SkipLink({ 
  targetId = 'main-content', 
  children = 'Skip to main content' 
}: SkipLinkProps) {
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      // Set tabindex to make non-interactive element focusable
      target.setAttribute('tabindex', '-1');
      target.focus();
      // Scroll into view
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [targetId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [targetId]);

  return (
    <a
      href={`#${targetId}`}
      className="skip-link"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </a>
  );
}

export default SkipLink;
