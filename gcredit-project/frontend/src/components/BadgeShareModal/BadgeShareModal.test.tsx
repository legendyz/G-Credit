/**
 * BadgeShareModal LinkedIn Tab Tests - Story 11.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BadgeShareModal from './BadgeShareModal';

// Mock badgeShareApi
vi.mock('../../lib/badgeShareApi', () => ({
  shareBadgeViaEmail: vi.fn(),
  shareBadgeToTeams: vi.fn(),
  recordLinkedInShare: vi.fn().mockResolvedValue(undefined),
}));

// Mock useFocusTrap
vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({ current: null }),
}));

describe('BadgeShareModal - LinkedIn Tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders LinkedIn tab in tab list', () => {
    render(
      <BadgeShareModal isOpen={true} onClose={vi.fn()} badgeId="badge-1" badgeName="Test Badge" />
    );

    expect(screen.getByRole('tab', { name: /linkedin/i })).toBeInTheDocument();
  });

  it('shows tab order: Email → LinkedIn → Teams → Widget', () => {
    render(
      <BadgeShareModal isOpen={true} onClose={vi.fn()} badgeId="badge-1" badgeName="Test Badge" />
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    expect(tabs[0]).toHaveTextContent(/email/i);
    expect(tabs[1]).toHaveTextContent(/linkedin/i);
    expect(tabs[2]).toHaveTextContent(/teams/i);
    expect(tabs[3]).toHaveTextContent(/widget/i);
  });

  it('shows LinkedIn share panel when tab is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BadgeShareModal isOpen={true} onClose={vi.fn()} badgeId="badge-1" badgeName="Test Badge" />
    );

    const linkedInTab = screen.getByRole('tab', { name: /linkedin/i });
    await user.click(linkedInTab);

    expect(screen.getByText(/Share on LinkedIn/i)).toBeInTheDocument();
    expect(screen.getByText(/Opens LinkedIn in a new window/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <BadgeShareModal isOpen={false} onClose={vi.fn()} badgeId="badge-1" badgeName="Test Badge" />
    );

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
});
