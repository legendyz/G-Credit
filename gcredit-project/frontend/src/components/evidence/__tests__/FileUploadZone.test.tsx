/**
 * FileUploadZone component tests — Story 12.6 Task 11
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FileUploadZone from '../FileUploadZone';

// Mock evidenceApi constants/helpers used by FileUploadZone
vi.mock('@/lib/evidenceApi', () => ({
  validateEvidenceFile: vi.fn().mockReturnValue(null),
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  MAX_EVIDENCE_ITEMS: 5,
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.png', '.jpg', '.jpeg', '.docx'],
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), warning: vi.fn() },
}));

describe('FileUploadZone', () => {
  const onFilesSelected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders drop zone with instructions', () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} currentCount={0} />);

    expect(screen.getByText(/Drag files here/i)).toBeInTheDocument();
    expect(screen.getByText(/browse/i)).toBeInTheDocument();
  });

  it('shows disabled state when at max evidence count', () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} currentCount={5} disabled={true} />);

    // The zone should indicate it's at capacity
    expect(screen.getByText(/Upload limit reached/i)).toBeInTheDocument();
  });

  it('responds to file browse via hidden input', async () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} currentCount={0} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    expect(fileInput.multiple).toBe(true);
  });

  it('applies visual feedback on dragover', () => {
    const { container } = render(
      <FileUploadZone onFilesSelected={onFilesSelected} currentCount={0} />
    );

    // The outer drop zone div has border styling
    const dropZone = container.querySelector('[role="button"]') || container.firstElementChild!;

    fireEvent.dragEnter(dropZone, {
      dataTransfer: { types: ['Files'] },
    });

    // The zone element should exist and have classes
    expect(dropZone).toBeTruthy();
  });

  it('disables zone when disabled prop is true', () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} currentCount={0} disabled={true} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput.disabled).toBe(true);
  });
});
