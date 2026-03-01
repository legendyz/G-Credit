/**
 * Layout Component (Story 15.3 — Sidebar Layout Migration, TD-035-C)
 *
 * WCAG 1.3.1 - Info and Relationships (Landmarks)
 * WCAG 2.4.1 - Bypass Blocks (Skip Links)
 *
 * Uses shadcn/ui SidebarProvider + SidebarInset for persistent
 * collapsible sidebar layout. Mobile uses Sheet overlay via SidebarTrigger.
 *
 * CRITICAL-15.3-ARCH-002: max-w-7xl stays inside SidebarInset.
 * DEC-15-04: Cookie-based sidebar state persistence (built into SidebarProvider).
 *
 * @see Story 15.3 — Sidebar Layout Migration
 * @see ADR-016 DEC-016-02 (Sidebar navigation groups)
 */

import type { ReactNode } from 'react';
import { SkipLink } from '@/components/ui/SkipLink';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AppSidebar } from '@/components/layout/AppSidebar';

interface LayoutProps {
  /** Page content */
  children: ReactNode;
  /** Page title for heading (h1) */
  pageTitle?: string;
  /** Show sidebar navigation */
  showNavbar?: boolean;
  /** Additional class for main content */
  className?: string;
}

export function Layout({ children, pageTitle, showNavbar = true, className = '' }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        {/* Skip Link - First focusable element (WCAG 2.4.1) */}
        <SkipLink targetId="main-content" />

        {/* Sidebar Navigation */}
        {showNavbar && <AppSidebar />}

        <SidebarInset>
          {/* Mobile header with sidebar trigger (< 768px) */}
          {showNavbar && (
            <header className="flex h-14 items-center gap-2 border-b px-4 md:hidden">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <span className="text-lg font-bold text-primary">G-Credit</span>
            </header>
          )}

          {/* Main Content Area — max-w-7xl preserved (CRITICAL-15.3-ARCH-002) */}
          <main
            id="main-content"
            role="main"
            tabIndex={-1}
            className={className}
            aria-label={pageTitle || 'Main content'}
          >
            <div className="max-w-7xl mx-auto">
              {/* Page heading for screen readers */}
              {pageTitle && <h1 className="sr-only">{pageTitle}</h1>}
              {children}
            </div>
          </main>

          {/* Footer with Contentinfo role */}
          <footer role="contentinfo" className="sr-only">
            <p>G-Credit Digital Badge Platform</p>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default Layout;
