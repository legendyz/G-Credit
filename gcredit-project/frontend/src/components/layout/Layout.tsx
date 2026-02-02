/**
 * Layout Component (Story 8.3 - AC2, AC5)
 * WCAG 1.3.1 - Info and Relationships (Landmarks)
 * WCAG 2.4.1 - Bypass Blocks (Skip Links)
 * 
 * Provides semantic HTML structure with proper landmarks
 * and skip navigation for accessibility.
 */

import type { ReactNode } from 'react';
import { SkipLink } from '@/components/ui/SkipLink';
import { Navbar } from '@/components/Navbar';

interface LayoutProps {
  /** Page content */
  children: ReactNode;
  /** Page title for heading (h1) */
  pageTitle?: string;
  /** Show navbar */
  showNavbar?: boolean;
  /** Additional class for main content */
  className?: string;
}

export function Layout({
  children,
  pageTitle,
  showNavbar = true,
  className = '',
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Skip Link - First focusable element (AC5) */}
      <SkipLink targetId="main-content" />

      {/* Header with Banner role */}
      {showNavbar && (
        <header role="banner">
          <Navbar />
        </header>
      )}

      {/* Main Content Area */}
      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        className={`p-6 ${className}`}
        aria-label={pageTitle || 'Main content'}
      >
        <div className="max-w-7xl mx-auto">
          {/* Page heading for screen readers (AC2) */}
          {pageTitle && (
            <h1 className="sr-only">{pageTitle}</h1>
          )}
          {children}
        </div>
      </main>

      {/* Footer with Contentinfo role */}
      <footer role="contentinfo" className="sr-only">
        <p>G-Credit Digital Badge Platform</p>
      </footer>
    </div>
  );
}

export default Layout;
