/**
 * BadgeImage Component Tests - Story 8.5: Responsive Design (AC5)
 *
 * Tests for responsive badge images with lazy loading and skeleton placeholders.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BadgeImage } from './BadgeImage';

describe('BadgeImage', () => {
  describe('Lazy Loading (AC5)', () => {
    it('renders image with loading="lazy" attribute', () => {
      render(<BadgeImage src="/badge.png" alt="Test Badge" />);
      const img = screen.getByRole('img', { name: /test badge/i });
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('renders image with decoding="async" attribute', () => {
      render(<BadgeImage src="/badge.png" alt="Test Badge" />);
      const img = screen.getByRole('img', { name: /test badge/i });
      expect(img).toHaveAttribute('decoding', 'async');
    });
  });

  describe('Skeleton Placeholder (AC5)', () => {
    it('shows skeleton while image is loading', () => {
      render(<BadgeImage src="/badge.png" alt="Test Badge" showSkeleton />);
      // Skeleton should be visible before image loads
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('hides skeleton after image loads', async () => {
      render(<BadgeImage src="/badge.png" alt="Test Badge" showSkeleton />);
      const img = screen.getByRole('img', { name: /test badge/i });
      
      fireEvent.load(img);
      
      await waitFor(() => {
        const skeleton = document.querySelector('.animate-pulse');
        expect(skeleton).not.toBeInTheDocument();
      });
    });

    it('can disable skeleton with showSkeleton=false', () => {
      render(<BadgeImage src="/badge.png" alt="Test Badge" showSkeleton={false} />);
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).not.toBeInTheDocument();
    });
  });

  describe('Responsive Sizes', () => {
    it('applies correct size classes for "sm" variant', () => {
      render(<BadgeImage src="/badge.png" alt="Test Badge" size="sm" />);
      const container = screen.getByRole('img').parentElement;
      expect(container).toHaveClass('w-16', 'h-16');
    });

    it('applies correct size classes for "md" variant (default)', () => {
      render(<BadgeImage src="/badge.png" alt="Test Badge" />);
      const container = screen.getByRole('img').parentElement;
      expect(container).toHaveClass('w-24', 'h-24');
    });

    it('applies correct size classes for "lg" variant', () => {
      render(<BadgeImage src="/badge.png" alt="Test Badge" size="lg" />);
      const container = screen.getByRole('img').parentElement;
      expect(container).toHaveClass('w-32', 'h-32');
    });

    it('applies correct size classes for "xl" variant', () => {
      render(<BadgeImage src="/badge.png" alt="Test Badge" size="xl" />);
      const container = screen.getByRole('img').parentElement;
      expect(container).toHaveClass('w-40', 'h-40');
    });
  });

  describe('Error Handling', () => {
    it('shows fallback image on error', async () => {
      render(<BadgeImage src="/invalid.png" alt="Test Badge" />);
      const img = screen.getByRole('img', { name: /test badge/i });
      
      fireEvent.error(img);
      
      await waitFor(() => {
        expect(img).toHaveAttribute('src', '/placeholder-badge.png');
      });
    });

    it('shows error state icon on load failure', async () => {
      render(<BadgeImage src="/invalid.png" alt="Test Badge" />);
      const img = screen.getByRole('img', { name: /test badge/i });
      
      fireEvent.error(img);
      
      await waitFor(() => {
        const errorIcon = document.querySelector('svg');
        expect(errorIcon).toBeInTheDocument();
      });
    });
  });

  describe('Placeholder Image', () => {
    it('uses placeholder when src is undefined', () => {
      render(<BadgeImage src={undefined} alt="Test Badge" />);
      const img = screen.getByRole('img', { name: /test badge/i });
      expect(img).toHaveAttribute('src', '/placeholder-badge.png');
    });
  });

  describe('Click Handler', () => {
    it('calls onClick when image is clicked', () => {
      const handleClick = vi.fn();
      render(<BadgeImage src="/badge.png" alt="Test Badge" onClick={handleClick} />);
      const img = screen.getByRole('img', { name: /test badge/i });
      
      fireEvent.click(img);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('adds cursor-pointer class when onClick is provided', () => {
      const handleClick = vi.fn();
      render(<BadgeImage src="/badge.png" alt="Test Badge" onClick={handleClick} />);
      const img = screen.getByRole('img', { name: /test badge/i });
      expect(img).toHaveClass('cursor-pointer');
    });
  });

  describe('Accessibility', () => {
    it('has proper alt text', () => {
      render(<BadgeImage src="/badge.png" alt="Test Badge for Achievement" />);
      const img = screen.getByRole('img', { name: /test badge for achievement/i });
      expect(img).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className to container', () => {
      render(<BadgeImage src="/badge.png" alt="Test Badge" className="custom-class" />);
      const container = screen.getByRole('img').parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });
});
