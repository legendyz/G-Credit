import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MilestoneTimelineCard } from './MilestoneTimelineCard';

describe('MilestoneTimelineCard', () => {
  const mockMilestone = {
    milestoneId: 'milestone-1',
    title: '🏆 First Badge Earned',
    description: 'Congratulations on earning your first badge!',
    achievedAt: '2026-01-15T10:00:00Z',
  };

  it('renders milestone title and description', () => {
    render(<MilestoneTimelineCard milestone={mockMilestone} />);
    expect(screen.getByText('🏆 First Badge Earned')).toBeInTheDocument();
    expect(screen.getByText('Congratulations on earning your first badge!')).toBeInTheDocument();
  });

  it('renders achieved date', () => {
    render(<MilestoneTimelineCard milestone={mockMilestone} />);
    expect(screen.getByText(/Achieved/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 15, 2026/)).toBeInTheDocument();
  });
});
