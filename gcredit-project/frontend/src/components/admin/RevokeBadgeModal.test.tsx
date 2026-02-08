/**
 * RevokeBadgeModal.test.tsx
 * Sprint 7 - Story 9.5: Revoke Badge Modal Unit Tests
 *
 * Tests for the revocation confirmation modal component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RevokeBadgeModal } from './RevokeBadgeModal';
import type { Badge } from '@/lib/badgesApi';

// Mock the badgesApi module
vi.mock('@/lib/badgesApi', async () => {
  const actual = await vi.importActual('@/lib/badgesApi');
  return {
    ...actual,
    revokeBadge: vi.fn(),
  };
});

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Sample badge for testing
const mockBadge: Badge = {
  id: 'badge-123',
  templateId: 'template-1',
  recipientId: 'user-1',
  issuerId: 'issuer-1',
  status: 'CLAIMED',
  issuedAt: '2026-01-15T10:00:00Z',
  template: {
    id: 'template-1',
    name: 'Excellence Award',
    description: 'Award for excellence',
  },
  recipient: {
    id: 'user-1',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
  },
  issuer: {
    id: 'issuer-1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
  },
};

describe('RevokeBadgeModal', () => {
  const defaultProps = {
    badge: mockBadge,
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when open with badge', () => {
      render(<RevokeBadgeModal {...defaultProps} />);

      expect(screen.getByText(/Revoke Badge - Excellence Award/i)).toBeInTheDocument();
      expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument();
    });

    it('should display badge information', () => {
      render(<RevokeBadgeModal {...defaultProps} />);

      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      // Excellence Award appears in title and badge info section
      expect(screen.getAllByText(/Excellence Award/i).length).toBeGreaterThan(0);
    });

    it('should show reason dropdown as required', () => {
      render(<RevokeBadgeModal {...defaultProps} />);

      expect(screen.getByText(/Revocation Reason/i)).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument(); // Required indicator
    });

    it('should show notes textarea as optional', () => {
      render(<RevokeBadgeModal {...defaultProps} />);

      expect(screen.getByText(/Additional Notes/i)).toBeInTheDocument();
      expect(screen.getByText(/optional/i)).toBeInTheDocument();
    });

    it('should show character count for notes', () => {
      render(<RevokeBadgeModal {...defaultProps} />);

      expect(screen.getByText('0/1000')).toBeInTheDocument();
    });

    it('should not render when badge is null', () => {
      render(<RevokeBadgeModal {...defaultProps} badge={null} />);

      expect(screen.queryByText(/Revoke Badge/i)).not.toBeInTheDocument();
    });

    it('should render Cancel and Confirm buttons', () => {
      render(<RevokeBadgeModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Confirm Revoke/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button when no reason selected', () => {
      render(<RevokeBadgeModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /Confirm Revoke/i });
      expect(submitButton).toBeDisabled();
    });

    it('should update character count when typing notes', async () => {
      const user = userEvent.setup();
      render(<RevokeBadgeModal {...defaultProps} />);

      const notesTextarea = screen.getByPlaceholderText(/Provide additional context/i);
      await user.type(notesTextarea, 'Test note');

      expect(screen.getByText('9/1000')).toBeInTheDocument();
    });

    it('should limit notes to 1000 characters', async () => {
      render(<RevokeBadgeModal {...defaultProps} />);

      const notesTextarea = screen.getByPlaceholderText(
        /Provide additional context/i
      ) as HTMLTextAreaElement;

      // Use fireEvent for faster input of long text
      const longText = 'a'.repeat(1100);
      fireEvent.change(notesTextarea, { target: { value: longText } });

      // Component should truncate to 1000 characters
      expect(notesTextarea.value.length).toBeLessThanOrEqual(1000);
      expect(screen.getByText('1000/1000')).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('should call onClose when Cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<RevokeBadgeModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible dialog description', () => {
      render(<RevokeBadgeModal {...defaultProps} />);

      expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument();
    });

    it('should have aria-label on notes textarea', () => {
      render(<RevokeBadgeModal {...defaultProps} />);

      expect(screen.getByLabelText(/Additional notes for revocation/i)).toBeInTheDocument();
    });
  });
});
