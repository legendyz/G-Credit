/**
 * EmptyState Component Tests - Story 8.1 (UX-P1-003)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  EmptyState,
  NoBadgesState,
  NoActivityState,
  NoTeamMembersState,
} from './EmptyState';

describe('EmptyState', () => {
  it('renders with title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(
      <EmptyState
        title="No items"
        description="Add some items to get started"
      />
    );
    expect(screen.getByText('Add some items to get started')).toBeInTheDocument();
  });

  it('renders with custom icon', () => {
    render(<EmptyState title="Empty" icon="🚀" />);
    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="Empty"
        actionText="Add Item"
        onAction={handleAction}
      />
    );

    const button = screen.getByRole('button', { name: 'Add Item' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleAction).toHaveBeenCalled();
  });

  it('does not render button without onAction', () => {
    render(<EmptyState title="Empty" actionText="Add Item" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('has proper accessibility', () => {
    render(<EmptyState title="No results" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'No results');
  });
});

describe('NoBadgesState', () => {
  it('renders with preset text', () => {
    render(<NoBadgesState />);
    expect(screen.getByText('No badges yet')).toBeInTheDocument();
    expect(
      screen.getByText('Start earning badges by completing skills and achievements.')
    ).toBeInTheDocument();
  });

  it('renders explore button when onExplore is provided', () => {
    const handleExplore = vi.fn();
    render(<NoBadgesState onExplore={handleExplore} />);

    const button = screen.getByRole('button', { name: 'Explore Badges' });
    fireEvent.click(button);
    expect(handleExplore).toHaveBeenCalled();
  });
});

describe('NoActivityState', () => {
  it('renders with preset text', () => {
    render(<NoActivityState />);
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });
});

describe('NoTeamMembersState', () => {
  it('renders with preset text', () => {
    render(<NoTeamMembersState />);
    expect(screen.getByText('No team members')).toBeInTheDocument();
  });
});
