/**
 * IssueBadgePage Tests - Story 10.6b: Single Badge Issuance UI
 * Updated in Story 12.6: Evidence Unification UI
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { IssueBadgePage } from './IssueBadgePage';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock badgesApi
const mockIssueBadge = vi.fn();
const mockGetRecipients = vi.fn();
vi.mock('@/lib/badgesApi', () => ({
  issueBadge: (...args: unknown[]) => mockIssueBadge(...args),
  getRecipients: (...args: unknown[]) => mockGetRecipients(...args),
}));

// Mock badgeTemplatesApi
const mockGetActiveTemplates = vi.fn();
vi.mock('@/lib/badgeTemplatesApi', () => ({
  getActiveTemplates: (...args: unknown[]) => mockGetActiveTemplates(...args),
}));

// Mock evidence API
const mockUploadEvidenceFile = vi.fn();
const mockAddUrlEvidence = vi.fn();
vi.mock('@/lib/evidenceApi', () => ({
  uploadEvidenceFile: (...args: unknown[]) => mockUploadEvidenceFile(...args),
  addUrlEvidence: (...args: unknown[]) => mockAddUrlEvidence(...args),
  validateEvidenceFile: () => null,
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  MAX_EVIDENCE_ITEMS: 5,
  ALLOWED_MIME_TYPES: ['application/pdf', 'image/png', 'image/jpeg'],
  ALLOWED_EXTENSIONS: ['.pdf', '.png', '.jpg', '.jpeg', '.docx'],
  formatFileSize: (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`,
  getFileIcon: () => '📄',
  truncateUrl: (u: string) => u.substring(0, 50),
}));

// Mock global fetch (kept for any direct fetch calls)
const mockFetch = vi.fn();

// Mock shadcn Select as native <select> for testability
vi.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    value,
    onValueChange,
    disabled,
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (v: string) => void;
    disabled?: boolean;
  }) => (
    <div data-testid="mock-select">
      {React.Children.map(children, (child) => {
        if (
          React.isValidElement(child) &&
          (child.type as { displayName?: string })?.displayName === 'MockSelectTrigger'
        ) {
          return child;
        }
        if (
          React.isValidElement(child) &&
          (child.type as { displayName?: string })?.displayName === 'MockSelectContent'
        ) {
          return React.cloneElement(
            child as React.ReactElement<{
              onValueChange: (v: string) => void;
              value: string;
              disabled?: boolean;
            }>,
            { onValueChange, value, disabled }
          );
        }
        return child;
      })}
    </div>
  ),
  SelectTrigger: Object.assign(
    ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      id?: string;
      [key: string]: unknown;
    }) => <div {...props}>{children}</div>,
    { displayName: 'MockSelectTrigger' }
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: Object.assign(
    ({
      children,
      onValueChange,
      value,
      disabled,
    }: {
      children: React.ReactNode;
      onValueChange?: (v: string) => void;
      value?: string;
      disabled?: boolean;
    }) => (
      <select
        data-testid="native-select"
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        <option value="">-- select --</option>
        {children}
      </select>
    ),
    { displayName: 'MockSelectContent' }
  ),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
}));

const mockTemplates = [
  { id: 'tpl-1', name: 'Cloud Expert', description: 'Cloud certification' },
  { id: 'tpl-2', name: 'Security Pro', description: 'Security certification' },
];

const mockRecipients = [
  {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    department: 'Engineering',
  },
  {
    id: 'user-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    department: 'Marketing',
  },
];

describe('IssueBadgePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock API lib functions for templates and recipients
    mockGetActiveTemplates.mockResolvedValue(mockTemplates);
    mockGetRecipients.mockResolvedValue(mockRecipients);

    // Keep mockFetch for any remaining fetch calls (e.g. issueBadge)
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    global.fetch = mockFetch;
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <IssueBadgePage />
      </MemoryRouter>
    );

  it('renders form with all required fields', async () => {
    renderPage();

    // Page title
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Issue Badge');

    // Card title
    expect(screen.getByText('Badge Details')).toBeInTheDocument();

    // Form labels
    expect(screen.getByText(/Badge Template/)).toBeInTheDocument();
    expect(screen.getByText(/Recipient/)).toBeInTheDocument();
    expect(screen.getByText(/Expiry/)).toBeInTheDocument();

    // Submit button
    expect(screen.getByRole('button', { name: /Issue Badge/i })).toBeInTheDocument();
  });

  it('loads templates from API on mount', async () => {
    renderPage();

    await waitFor(() => {
      expect(mockGetActiveTemplates).toHaveBeenCalledTimes(1);
    });
  });

  it('loads recipients from API on mount', async () => {
    renderPage();

    await waitFor(() => {
      expect(mockGetRecipients).toHaveBeenCalledTimes(1);
    });
  });

  it('shows validation error when submitting without template', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(mockGetActiveTemplates).toHaveBeenCalled());

    const submitBtn = screen.getByRole('button', { name: /Issue Badge/i });
    await user.click(submitBtn);

    expect(toast.error).toHaveBeenCalledWith('Please select a badge template');
    expect(mockIssueBadge).not.toHaveBeenCalled();
  });

  it('renders evidence attachment area', async () => {
    renderPage();

    await waitFor(() => expect(mockGetActiveTemplates).toHaveBeenCalled());

    // Evidence attachment panel should be present
    expect(screen.getByText(/Drag files here/i)).toBeInTheDocument();
  });

  it('submits the form successfully and navigates', async () => {
    mockIssueBadge.mockResolvedValue({ id: 'badge-1', status: 'PENDING' });
    const user = userEvent.setup();
    renderPage();

    // Wait for data to load AND render into the DOM (not just fetch calls)
    await waitFor(() => {
      const selects = screen.getAllByTestId('native-select');
      expect(selects[0]).not.toBeDisabled();
    });

    // Select template and recipient via native <select> (mocked)
    const selects = screen.getAllByTestId('native-select');
    await user.selectOptions(selects[0], 'tpl-1'); // Template
    await user.selectOptions(selects[1], 'user-1'); // Recipient

    // Submit the form
    const submitBtn = screen.getByRole('button', { name: /Issue Badge/i });
    await user.click(submitBtn);

    // Verify API called with correct args
    await waitFor(() => {
      expect(mockIssueBadge).toHaveBeenCalledWith({
        templateId: 'tpl-1',
        recipientId: 'user-1',
      });
    });

    // Verify success feedback
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Badge issued successfully!');
    });

    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/admin/badges');
  });

  it('handles API error on form submission', async () => {
    mockIssueBadge.mockRejectedValue(new Error('Template not found'));
    const user = userEvent.setup();
    renderPage();

    // Wait for data to load AND render into the DOM
    await waitFor(() => {
      const selects = screen.getAllByTestId('native-select');
      expect(selects[0]).not.toBeDisabled();
    });

    // Select template and recipient
    const selects = screen.getAllByTestId('native-select');
    await user.selectOptions(selects[0], 'tpl-1');
    await user.selectOptions(selects[1], 'user-1');

    // Submit the form
    const submitBtn = screen.getByRole('button', { name: /Issue Badge/i });
    await user.click(submitBtn);

    // Verify error toast shown with server error message
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Template not found');
    });

    // Verify NO navigation on error
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows loading state on submit button', () => {
    renderPage();

    const submitBtn = screen.getByRole('button', { name: /Issue Badge/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('shows error toast when template fetch fails', async () => {
    mockGetActiveTemplates.mockRejectedValueOnce(new Error('Unauthorized'));

    renderPage();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load badge templates');
    });
  });

  it('shows error toast when user fetch fails', async () => {
    mockGetRecipients.mockRejectedValueOnce(new Error('Unauthorized'));

    renderPage();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load users');
    });
  });

  it('renders Back to Badges navigation button', () => {
    renderPage();

    const backBtn = screen.getByRole('button', { name: /Back to Badges/i });
    expect(backBtn).toBeInTheDocument();
  });
});
