/**
 * VerifyBadgePage evidence rendering tests
 * Story 12.6 code review fix: Verify type-aware FILE/URL evidence mapping
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { VerifyBadgePage } from './VerifyBadgePage';

// Mock apiFetch
vi.mock('../lib/apiFetch', () => ({
  apiFetch: vi.fn(),
}));

// Mock evidenceApi (preview/download)
vi.mock('../lib/evidenceApi', () => ({
  getEvidencePreviewUrl: vi.fn(),
  getEvidenceDownloadUrl: vi.fn(),
  formatFileSize: (bytes: number) =>
    bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`,
  getFileIcon: () => '📄',
  truncateUrl: (url: string) => (url.length > 50 ? url.slice(0, 50) + '…' : url),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

import { apiFetch } from '../lib/apiFetch';

const mockVerifyResponse = (evidenceFiles: unknown[] = []) => ({
  badgeId: 'badge-123',
  verificationId: 'verify-abc',
  verificationStatus: 'active',
  isValid: true,
  issuedOn: '2026-01-15T00:00:00Z',
  expiresAt: null,
  claimedAt: '2026-01-16T00:00:00Z',
  _meta: {
    badge: {
      name: 'Test Badge',
      description: 'A test badge',
      imageUrl: null,
      criteria: 'Complete the test',
      category: 'Testing',
      skills: [],
    },
    recipient: {
      name: 'John Doe',
      email: 'j***@example.com',
    },
    issuer: {
      name: 'Admin User',
      email: 'a***@example.com',
    },
    evidenceFiles,
  },
});

function renderWithRouter(verificationId = 'verify-abc') {
  return render(
    <MemoryRouter initialEntries={[`/verify/${verificationId}`]}>
      <Routes>
        <Route path="/verify/:verificationId" element={<VerifyBadgePage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('VerifyBadgePage — Evidence Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders FILE-type evidence with name, size, and download button', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve(
          mockVerifyResponse([
            {
              id: 'ev-1',
              filename: 'stored-name.pdf',
              originalName: 'report.pdf',
              fileSize: 2048,
              mimeType: 'application/pdf',
              blobUrl: 'https://blob.test/report.pdf',
              uploadedAt: '2026-01-20T00:00:00Z',
              type: 'FILE',
              sourceUrl: null,
            },
          ])
        ),
    } as Response);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });

    expect(screen.getByText(/2\.0 KB/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download report\.pdf/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preview report\.pdf/i })).toBeInTheDocument();
  });

  it('renders URL-type evidence with Open link', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve(
          mockVerifyResponse([
            {
              id: 'ev-2',
              filename: '',
              originalName: 'GitHub PR',
              fileSize: 0,
              mimeType: '',
              blobUrl: '',
              uploadedAt: '2026-01-20T00:00:00Z',
              type: 'URL',
              sourceUrl: 'https://github.com/org/repo/pull/42',
            },
          ])
        ),
    } as Response);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/github\.com/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /open.*github/i })).toBeInTheDocument();
    // Should NOT show download for URL type
    expect(screen.queryByRole('button', { name: /download.*github/i })).not.toBeInTheDocument();
  });

  it('renders mixed FILE and URL evidence items', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve(
          mockVerifyResponse([
            {
              id: 'ev-1',
              filename: 'report.pdf',
              originalName: 'report.pdf',
              fileSize: 1024,
              mimeType: 'application/pdf',
              blobUrl: 'https://blob.test/report.pdf',
              uploadedAt: '2026-01-20T00:00:00Z',
              type: 'FILE',
              sourceUrl: null,
            },
            {
              id: 'ev-2',
              filename: '',
              originalName: 'Link',
              fileSize: 0,
              mimeType: '',
              blobUrl: '',
              uploadedAt: '2026-01-20T00:00:00Z',
              type: 'URL',
              sourceUrl: 'https://example.com/proof',
            },
          ])
        ),
    } as Response);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Evidence')).toBeInTheDocument();
    });

    // FILE item
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    // URL item — Open button
    expect(screen.getByRole('button', { name: /open.*example\.com/i })).toBeInTheDocument();
  });

  it('does not render evidence section when no evidence items', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockVerifyResponse([])),
    } as Response);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    expect(screen.queryByText('Evidence')).not.toBeInTheDocument();
  });
});
