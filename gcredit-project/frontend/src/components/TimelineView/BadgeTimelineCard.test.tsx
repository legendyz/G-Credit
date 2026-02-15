/**
 * BadgeTimelineCard Component Tests - Story 11.4 (Visibility Toggle)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

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
    render(<BadgeTimelineCard badge={makeBadge({ visibility: 'PUBLIC' })} />, { wrapper });

    const toggleBtn = screen.getByTitle('Set to Private');
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute('aria-label', 'Badge visibility: public');
  });

  it('renders lock icon for PRIVATE badge', () => {
    render(<BadgeTimelineCard badge={makeBadge({ visibility: 'PRIVATE' })} />, { wrapper });

    const toggleBtn = screen.getByTitle('Set to Public');
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute('aria-label', 'Badge visibility: private');
  });

  it('renders globe icon when visibility is undefined (defaults PUBLIC)', () => {
    render(<BadgeTimelineCard badge={makeBadge({ visibility: undefined })} />, { wrapper });

    const toggleBtn = screen.getByTitle('Set to Private');
    expect(toggleBtn).toBeInTheDocument();
  });

  // Story 11.24 AC-M9: Image null fallback
  it('renders placeholder when imageUrl is null', () => {
    render(
      <BadgeTimelineCard
        badge={makeBadge({
          template: {
            id: 'template-1',
            name: 'No Image Badge',
            description: 'A badge without an image',
            imageUrl: null as unknown as string,
            category: 'achievement',
          },
        })}
      />,
      { wrapper }
    );
    expect(screen.getByText('No Image Badge')).toBeInTheDocument();
    // Should not have an img element
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
