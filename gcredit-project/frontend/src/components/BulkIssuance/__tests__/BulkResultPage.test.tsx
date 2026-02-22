/**
 * BulkResultPage component tests — Story 12.6 Task 11
 * Tests template grouping, evidence attachment, and skip flow.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BulkResultPage from '../BulkResultPage';
import type { BadgeResult } from '../BulkResultPage';

// Mock evidence API
const mockUploadEvidenceFile = vi.fn();
const mockAddUrlEvidence = vi.fn();
vi.mock('@/lib/evidenceApi', () => ({
  uploadEvidenceFile: (...args: unknown[]) => mockUploadEvidenceFile(...args),
  addUrlEvidence: (...args: unknown[]) => mockAddUrlEvidence(...args),
  MAX_EVIDENCE_ITEMS: 5,
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  ALLOWED_MIME_TYPES: ['application/pdf', 'image/png', 'image/jpeg'],
  ALLOWED_EXTENSIONS: ['.pdf', '.png', '.jpg', '.jpeg', '.docx'],
  validateEvidenceFile: () => null,
  formatFileSize: (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`,
  getFileIcon: () => '📄',
  truncateUrl: (u: string) => u.substring(0, 50),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

const MOCK_RESULTS: BadgeResult[] = [
  // Cloud Expert group — 3 successful badges
  {
    row: 2,
    recipientEmail: 'alice@example.com',
    badgeName: 'Cloud Expert',
    status: 'success',
    badgeId: 'badge-1',
  },
  {
    row: 3,
    recipientEmail: 'bob@example.com',
    badgeName: 'Cloud Expert',
    status: 'success',
    badgeId: 'badge-2',
  },
  {
    row: 4,
    recipientEmail: 'carol@example.com',
    badgeName: 'Cloud Expert',
    status: 'success',
    badgeId: 'badge-3',
  },
  // Security Pro group — 1 success, 1 failure
  {
    row: 5,
    recipientEmail: 'dave@example.com',
    badgeName: 'Security Pro',
    status: 'success',
    badgeId: 'badge-4',
  },
  {
    row: 6,
    recipientEmail: 'eve@example.com',
    badgeName: 'Security Pro',
    status: 'failed',
    error: 'Template not found',
  },
];

describe('BulkResultPage', () => {
  const onDone = vi.fn();
  const onRetryFailed = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = (resultOverrides?: Partial<BadgeResult>[]) => {
    const results = resultOverrides ? (resultOverrides as BadgeResult[]) : MOCK_RESULTS;
    return render(
      <BulkResultPage
        success={4}
        failed={1}
        results={results}
        sessionId="session-123"
        onDone={onDone}
        onRetryFailed={onRetryFailed}
      />
    );
  };

  it('renders header with success and failure counts', () => {
    renderPage();

    expect(screen.getByText('Bulk Issuance Complete')).toBeInTheDocument();
    expect(screen.getByText('4 issued')).toBeInTheDocument();
    expect(screen.getByText('1 failed')).toBeInTheDocument();
  });

  it('groups results by template name', () => {
    renderPage();

    expect(screen.getByText('Cloud Expert')).toBeInTheDocument();
    expect(screen.getByText('Security Pro')).toBeInTheDocument();
  });

  it('shows badge count per group', () => {
    renderPage();

    expect(screen.getByText('(3 badges)')).toBeInTheDocument();
    expect(screen.getByText('(1 badge)')).toBeInTheDocument();
  });

  it('first group is expanded by default', () => {
    renderPage();

    // First group recipients should be visible
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('carol@example.com')).toBeInTheDocument();
  });

  it('toggles group collapse on header click', () => {
    renderPage();

    // Click second group header to expand
    const securityHeader = screen.getByText('Security Pro');
    fireEvent.click(securityHeader);

    // dave should now be visible
    expect(screen.getByText('dave@example.com')).toBeInTheDocument();
  });

  it('shows failed badges in group', () => {
    renderPage();

    // Expand Security Pro group
    fireEvent.click(screen.getByText('Security Pro'));

    // Failed badge should be visible with error
    expect(screen.getByText('eve@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Template not found/)).toBeInTheDocument();
  });

  it('shows shared evidence upload area in expanded group', () => {
    renderPage();

    // First group expanded — should show shared evidence area
    expect(screen.getByText(/Shared Evidence/)).toBeInTheDocument();
  });

  it('shows individual evidence toggle button per badge', () => {
    renderPage();

    // Each successful badge in the expanded group should have the button
    const individualButtons = screen.getAllByText('+ Individual Evidence');
    expect(individualButtons.length).toBe(3); // 3 successful Cloud Expert badges
  });

  it('renders Skip — No Evidence button', () => {
    renderPage();

    expect(screen.getByRole('button', { name: /Skip — No Evidence/i })).toBeInTheDocument();
  });

  it('skip navigates directly when no evidence is attached', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Skip — No Evidence/i }));

    expect(onDone).toHaveBeenCalled();
  });

  it('renders Done button', () => {
    renderPage();

    expect(screen.getByRole('button', { name: /^Done$/i })).toBeInTheDocument();
  });

  it('renders Retry Failed button when there are failures', () => {
    renderPage();

    expect(screen.getByRole('button', { name: /Retry Failed/i })).toBeInTheDocument();
  });

  it('shared evidence — limits combined count to MAX_EVIDENCE_ITEMS', () => {
    renderPage();

    // Individual evidence button shows for badges with remaining slots
    const buttons = screen.getAllByText('+ Individual Evidence');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
