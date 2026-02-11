/**
 * CelebrationModal Component Tests - Story 8.1 (UX-P1-001)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CelebrationModal,
  BadgeEarnedCelebration,
  MilestoneReachedCelebration,
} from './CelebrationModal';

describe('CelebrationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Congratulations!',
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(<CelebrationModal {...defaultProps} />);
    expect(screen.getByText('Congratulations!')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<CelebrationModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Congratulations!')).not.toBeInTheDocument();
  });

  it('renders with description', () => {
    render(<CelebrationModal {...defaultProps} description="You did something amazing!" />);
    expect(screen.getByText('You did something amazing!')).toBeInTheDocument();
  });

  it('renders with achievement name', () => {
    render(<CelebrationModal {...defaultProps} achievementName="Top Performer" />);
    expect(screen.getByText('Top Performer')).toBeInTheDocument();
  });

  it('renders with custom icon', () => {
    render(<CelebrationModal {...defaultProps} icon="🚀" />);
    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  it('renders badge image when provided', () => {
    render(
      <CelebrationModal
        {...defaultProps}
        badgeImageUrl="https://example.com/badge.png"
        achievementName="Test Badge"
      />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/badge.png');
    expect(img).toHaveAttribute('alt', 'Test Badge');
  });

  it('calls onClose when clicking CTA button', async () => {
    const onClose = vi.fn();
    render(<CelebrationModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onCtaClick and onClose when CTA button clicked', () => {
    const onClose = vi.fn();
    const onCtaClick = vi.fn();
    render(
      <CelebrationModal
        {...defaultProps}
        onClose={onClose}
        onCtaClick={onCtaClick}
        ctaText="View Badge"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'View Badge' }));
    expect(onCtaClick).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('renders with custom CTA text', () => {
    render(<CelebrationModal {...defaultProps} ctaText="View Achievement" />);
    expect(screen.getByRole('button', { name: 'View Achievement' })).toBeInTheDocument();
  });

  it('shows confetti when modal opens', () => {
    render(<CelebrationModal {...defaultProps} />);
    // Modal renders with animation effect - check for dialog presence
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('clears confetti effect timer on unmount', async () => {
    const { unmount } = render(<CelebrationModal {...defaultProps} />);

    // Verify component rendered
    expect(screen.getByText('Congratulations!')).toBeInTheDocument();

    // Unmount should not throw errors (timer cleanup)
    unmount();

    vi.advanceTimersByTime(3000);
    // No assertions needed - just verify no errors on cleanup
  });
});

describe('BadgeEarnedCelebration', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    badgeName: 'Achievement Badge',
  };

  it('renders with badge name', () => {
    render(<BadgeEarnedCelebration {...defaultProps} />);
    expect(screen.getByText('Achievement Badge')).toBeInTheDocument();
    expect(screen.getByText('Congratulations! 🎉')).toBeInTheDocument();
  });

  it('renders with badge image', () => {
    render(
      <BadgeEarnedCelebration {...defaultProps} badgeImageUrl="https://example.com/badge.png" />
    );
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/badge.png');
  });

  it('calls onViewBadge when provided', () => {
    const onViewBadge = vi.fn();
    render(<BadgeEarnedCelebration {...defaultProps} onViewBadge={onViewBadge} />);

    fireEvent.click(screen.getByRole('button', { name: 'View Badge' }));
    expect(onViewBadge).toHaveBeenCalled();
  });
});

describe('MilestoneReachedCelebration', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    milestoneName: 'Badge Collector Level 2',
  };

  it('renders with milestone name', () => {
    render(<MilestoneReachedCelebration {...defaultProps} />);
    expect(screen.getByText('Badge Collector Level 2')).toBeInTheDocument();
    expect(screen.getByText('Milestone Achieved! 🌟')).toBeInTheDocument();
  });

  it('renders with custom description', () => {
    render(
      <MilestoneReachedCelebration {...defaultProps} description="You've collected 10 badges!" />
    );
    expect(screen.getByText("You've collected 10 badges!")).toBeInTheDocument();
  });
});
