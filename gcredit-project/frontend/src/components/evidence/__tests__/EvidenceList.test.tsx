/**
 * EvidenceList component tests — Story 12.6 Task 11
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EvidenceList from '../EvidenceList';
import type { EvidenceItem } from '@/lib/evidenceApi';

// Mock evidenceApi functions used by EvidenceList
vi.mock('@/lib/evidenceApi', async () => {
  const actual = await vi.importActual('@/lib/evidenceApi');
  return {
    ...actual,
    getEvidencePreviewUrl: vi.fn().mockResolvedValue({ url: 'https://sas.example.com/preview' }),
    getEvidenceDownloadUrl: vi.fn().mockResolvedValue({ url: 'https://sas.example.com/download' }),
  };
});

const FILE_ITEM: EvidenceItem = {
  id: 'ev-1',
  type: 'FILE',
  name: 'certificate.pdf',
  url: 'https://blob.example.com/cert.pdf',
  size: 2_100_000,
  mimeType: 'application/pdf',
  uploadedAt: '2026-01-20T10:00:00Z',
};

const URL_ITEM: EvidenceItem = {
  id: 'ev-2',
  type: 'URL',
  name: 'https://coursera.org/verify/ABC123',
  url: 'https://coursera.org/verify/ABC123',
  uploadedAt: '2026-01-20T11:00:00Z',
};

describe('EvidenceList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when items is empty', () => {
    const { container } = render(<EvidenceList items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders FILE item with name, size, and action buttons', () => {
    render(<EvidenceList items={[FILE_ITEM]} badgeId="badge-1" />);

    expect(screen.getByText('certificate.pdf')).toBeInTheDocument();
    expect(screen.getByText(/2\.0 MB/)).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  it('renders URL item with truncated URL and Open button', () => {
    render(<EvidenceList items={[URL_ITEM]} />);

    // URL should be rendered (potentially truncated)
    expect(screen.getByText(/coursera\.org/)).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders both FILE and URL items together', () => {
    render(<EvidenceList items={[FILE_ITEM, URL_ITEM]} badgeId="badge-1" />);

    expect(screen.getByText('certificate.pdf')).toBeInTheDocument();
    expect(screen.getByText(/coursera\.org/)).toBeInTheDocument();
  });

  it('shows remove buttons in editable mode', () => {
    const onRemove = vi.fn();
    render(
      <EvidenceList
        items={[FILE_ITEM, URL_ITEM]}
        editable={true}
        onRemove={onRemove}
        badgeId="badge-1"
      />
    );

    // Should have ✕ buttons
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    expect(removeButtons.length).toBe(2);
  });

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();
    render(
      <EvidenceList items={[FILE_ITEM]} editable={true} onRemove={onRemove} badgeId="badge-1" />
    );

    const removeBtn = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalledWith('ev-1');
  });

  it('hides remove buttons in read-only mode', () => {
    render(<EvidenceList items={[FILE_ITEM]} editable={false} badgeId="badge-1" />);

    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });

  it('does not show remove buttons by default (editable defaults to false)', () => {
    render(<EvidenceList items={[FILE_ITEM]} badgeId="badge-1" />);

    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });
});
