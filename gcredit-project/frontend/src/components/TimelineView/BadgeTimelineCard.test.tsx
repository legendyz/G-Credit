/**
 * BadgeTimelineCard Component Tests - Story 11.4 (Visibility Toggle)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BadgeTimelineCard } from './BadgeTimelineCard';
import type { Badge } from '../../hooks/useWallet';

// Mock dependencies
vi.mock('../../stores/badgeDetailModal', () => ({
  useBadgeDetailModal: () => ({ openModal: vi.fn() }),
}));

vi.mock('../../lib/apiFetch', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const makeBadge = (overrides: Partial<Badge> = {}): Badge => ({
  id: 'badge-1',
  recipientId: 'user-1',
  issuedAt: '2026-01-20T10:00:00Z',
  status: 'CLAIMED' as Badge['status'],
  visibility: 'PUBLIC',
  template: {
    id: 'template-1',
    name: 'Test Badge',
    description: 'A test badge',
    imageUrl: 'https://example.com/badge.png',
    category: 'achievement',
  },
  issuer: {
    id: 'issuer-1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
  },
  ...overrides,
});

describe('BadgeTimelineCard - Visibility Toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders visibility toggle button for PUBLIC badge', () => {
    render(<BadgeTimelineCard badge={makeBadge({ visibility: 'PUBLIC' })} />);

    const toggleBtn = screen.getByTitle('Set to Private');
    expect(toggleBtn).toBeInTheDocument();
    expect(screen.getByText('🌐')).toBeInTheDocument();
  });

  it('renders lock icon for PRIVATE badge', () => {
    render(<BadgeTimelineCard badge={makeBadge({ visibility: 'PRIVATE' })} />);

    const toggleBtn = screen.getByTitle('Set to Public');
    expect(toggleBtn).toBeInTheDocument();
    expect(screen.getByText('🔒')).toBeInTheDocument();
  });

  it('renders globe icon when visibility is undefined (defaults PUBLIC)', () => {
    render(<BadgeTimelineCard badge={makeBadge({ visibility: undefined })} />);

    const toggleBtn = screen.getByTitle('Set to Private');
    expect(toggleBtn).toBeInTheDocument();
  });
});
