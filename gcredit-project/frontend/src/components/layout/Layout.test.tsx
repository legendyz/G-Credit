/**
 * Layout Component Tests — Story 15.3 (TD-035-C)
 *
 * Tests for sidebar-based layout with SidebarProvider + SidebarInset.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';

// Mock AppSidebar (tested separately in AppSidebar.test.tsx)
vi.mock('@/components/layout/AppSidebar', () => ({
  AppSidebar: () => <nav data-testid="app-sidebar">Sidebar</nav>,
}));

vi.mock('@/components/ui/SkipLink', () => ({
  SkipLink: () => <a data-testid="skip-link">Skip to content</a>,
}));

// Mock SidebarProvider and SidebarInset to simplify testing
vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  SidebarInset: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-inset">{children}</div>
  ),
  SidebarTrigger: ({ className }: { className?: string }) => (
    <button data-testid="sidebar-trigger" className={className}>
      Toggle
    </button>
  ),
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <div data-testid="separator" />,
}));

const renderLayout = (props = {}) => {
  return render(
    <BrowserRouter>
      <Layout {...props}>
        <div data-testid="content">Test Content</div>
      </Layout>
    </BrowserRouter>
  );
};

describe('Layout', () => {
  describe('Sidebar Rendering', () => {
    it('renders AppSidebar when showNavbar is true', () => {
      renderLayout();
      expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
    });

    it('does not render AppSidebar when showNavbar is false', () => {
      renderLayout({ showNavbar: false });
      expect(screen.queryByTestId('app-sidebar')).not.toBeInTheDocument();
    });

    it('wraps content in SidebarProvider', () => {
      renderLayout();
      expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument();
    });

    it('wraps main content in SidebarInset', () => {
      renderLayout();
      expect(screen.getByTestId('sidebar-inset')).toBeInTheDocument();
    });
  });

  describe('Mobile Header', () => {
    it('renders mobile header with SidebarTrigger', () => {
      renderLayout();
      expect(screen.getByTestId('sidebar-trigger')).toBeInTheDocument();
    });

    it('does not render mobile header when showNavbar is false', () => {
      renderLayout({ showNavbar: false });
      expect(screen.queryByTestId('sidebar-trigger')).not.toBeInTheDocument();
    });
  });

  describe('Skip Link', () => {
    it('renders skip link for accessibility', () => {
      renderLayout();
      expect(screen.getByTestId('skip-link')).toBeInTheDocument();
    });
  });

  describe('Main Content', () => {
    it('renders children content', () => {
      renderLayout();
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('main has proper landmark attributes', () => {
      renderLayout({ pageTitle: 'Test Page' });

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
      expect(main).toHaveAttribute('aria-label', 'Test Page');
    });

    it('renders visually hidden h1 when pageTitle is provided', () => {
      renderLayout({ pageTitle: 'Dashboard' });

      const heading = screen.getByRole('heading', { level: 1, name: 'Dashboard' });
      expect(heading).toHaveClass('sr-only');
    });
  });

  describe('Container Width (CRITICAL-15.3-ARCH-002)', () => {
    it('has max-width container for content inside SidebarInset', () => {
      renderLayout();

      const container = screen.getByTestId('content').parentElement;
      expect(container).toHaveClass('max-w-7xl', 'mx-auto');
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className to main element', () => {
      renderLayout({ className: 'custom-main-class' });

      const main = screen.getByRole('main');
      expect(main).toHaveClass('custom-main-class');
    });
  });
});
