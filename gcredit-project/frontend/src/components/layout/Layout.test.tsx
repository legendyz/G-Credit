/**
 * Layout Component Tests - Story 8.5: Responsive Design
 *
 * Tests for responsive layout with mobile/desktop navigation switching.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';

// Mock child components
vi.mock('@/components/Navbar', () => ({
  Navbar: () => <nav data-testid="desktop-navbar">Desktop Nav</nav>,
}));

vi.mock('@/components/layout/MobileNav', () => ({
  MobileNav: ({ className }: { className?: string }) => (
    <nav data-testid="mobile-navbar" className={className}>
      Mobile Nav
    </nav>
  ),
}));

vi.mock('@/components/ui/SkipLink', () => ({
  SkipLink: () => <a data-testid="skip-link">Skip to content</a>,
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
  describe('Navigation Rendering', () => {
    it('renders both mobile and desktop navigation', () => {
      renderLayout();

      expect(screen.getByTestId('mobile-navbar')).toBeInTheDocument();
      expect(screen.getByTestId('desktop-navbar')).toBeInTheDocument();
    });

    it('mobile nav has md:hidden class for responsive hiding', () => {
      renderLayout();

      const mobileNav = screen.getByTestId('mobile-navbar');
      expect(mobileNav).toHaveClass('md:hidden');
    });

    it('desktop nav wrapper has hidden md:block for responsive display', () => {
      renderLayout();

      const desktopNavWrapper = screen.getByTestId('desktop-navbar').parentElement;
      expect(desktopNavWrapper).toHaveClass('hidden', 'md:block');
    });

    it('does not render navigation when showNavbar is false', () => {
      renderLayout({ showNavbar: false });

      expect(screen.queryByTestId('mobile-navbar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('desktop-navbar')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Padding', () => {
    it('main content has responsive padding classes', () => {
      renderLayout();

      const main = screen.getByRole('main');
      expect(main).toHaveClass('px-4', 'py-6', 'md:px-8', 'md:py-8');
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

  describe('Container Width', () => {
    it('has max-width container for content', () => {
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
