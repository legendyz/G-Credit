/**
 * ClaimSuccessModal Component Tests - Story 11.4 (Visibility Hint)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClaimSuccessModal } from './ClaimSuccessModal';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock react-query
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

describe('ClaimSuccessModal - Story 11.4', () => {
  it('shows visibility hint text when open', () => {
    render(<ClaimSuccessModal isOpen={true} onClose={vi.fn()} badgeName="Test Badge" />);

    expect(
      screen.getByText(
        'Your badge is publicly visible. You can change this anytime from your wallet.'
      )
    ).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ClaimSuccessModal isOpen={false} onClose={vi.fn()} badgeName="Test Badge" />);

    expect(
      screen.queryByText(
        'Your badge is publicly visible. You can change this anytime from your wallet.'
      )
    ).not.toBeInTheDocument();
  });
});
