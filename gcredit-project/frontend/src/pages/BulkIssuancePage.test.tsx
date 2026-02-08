/**
 * BulkIssuancePage Tests - Story 8.1: CSV Template & Validation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BulkIssuancePage } from './BulkIssuancePage';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock TemplateSelector component
vi.mock('../components/BulkIssuance/TemplateSelector', () => ({
  TemplateSelector: ({ onSelect, disabled }: any) => (
    <div data-testid="template-selector">
      <input
        placeholder="Search badge templates..."
        disabled={disabled}
        onChange={(e: any) => onSelect(e.target.value || null)}
        aria-label="Search badge templates"
      />
    </div>
  ),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BulkIssuancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('test-token');
  });

  const renderPage = () => {
    return render(
      <MemoryRouter>
        <BulkIssuancePage />
      </MemoryRouter>
    );
  };

  it('renders download template button', () => {
    renderPage();
    
    const downloadButton = screen.getByRole('button', { name: /download csv template/i });
    expect(downloadButton).toBeInTheDocument();
  });

  it('download button calls API and triggers file download', async () => {
    // Mock successful blob response
    const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
      headers: new Headers({
        'Content-Disposition': 'attachment; filename="bulk-badge-issuance-template-2026-02-07.csv"',
      }),
    });

    // Mock URL.createObjectURL and revokeObjectURL
    const mockUrl = 'blob:http://localhost/mock-url';
    const createObjectURLSpy = vi.fn().mockReturnValue(mockUrl);
    const revokeObjectURLSpy = vi.fn();
    window.URL.createObjectURL = createObjectURLSpy;
    window.URL.revokeObjectURL = revokeObjectURLSpy;

    // Mock document.createElement to track link click
    const mockClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const element = originalCreateElement(tag);
      if (tag === 'a') {
        element.click = mockClick;
      }
      return element;
    });

    renderPage();

    const downloadButton = screen.getByRole('button', { name: /download csv template/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/bulk-issuance/template'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('CSV template downloaded successfully');
    });
  });

  it('shows success toast after download', async () => {
    const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
      headers: new Headers(),
    });

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
    window.URL.revokeObjectURL = vi.fn();

    renderPage();

    const downloadButton = screen.getByRole('button', { name: /download csv template/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('CSV template downloaded successfully');
    });
  });

  it('renders upload area with drag and drop instructions', () => {
    renderPage();
    
    expect(screen.getByText(/drag & drop csv file here/i)).toBeInTheDocument();
    expect(screen.getByText(/\.csv and \.txt files up to 100KB/i)).toBeInTheDocument();
  });

  it('renders step 1 and step 2 sections', () => {
    renderPage();
    
    expect(screen.getByText('Step 1: Download Template')).toBeInTheDocument();
    expect(screen.getByText('Step 2: Upload CSV')).toBeInTheDocument();
  });

  it('renders instructions list', () => {
    renderPage();
    
    expect(screen.getByText(/download the csv template above/i)).toBeInTheDocument();
    expect(screen.getByText(/open in excel or google sheets/i)).toBeInTheDocument();
    expect(screen.getByText(/delete the example rows/i)).toBeInTheDocument();
  });

  it('upload button is disabled when no file selected', () => {
    renderPage();
    
    const uploadButton = screen.getByRole('button', { name: 'Upload CSV' });
    expect(uploadButton).toBeDisabled();
  });

  it('shows file preview with name and size when file selected', async () => {
    renderPage();

    const dropZone = screen.getByRole('button', { name: /upload csv file/i });
    const file = new File(['badgeTemplateId,recipientEmail\ntest,test@test.com'], 'test.csv', { type: 'text/csv' });

    // Simulate file input change via the hidden input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Use Object.defineProperty to set files
    Object.defineProperty(fileInput, 'files', { value: [file], writable: false });
    fireEvent.change(fileInput);

    await waitFor(() => {
      const preview = screen.getByTestId('file-preview');
      expect(preview).toBeInTheDocument();
      expect(preview.textContent).toContain('test.csv');
    });
  });

  it('shows validation summary when upload has errors', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        totalRows: 20,
        validRows: 15,
        errorRows: 5,
        sessionId: 'session-123',
        errors: [],
      }),
    });

    renderPage();

    // Simulate file selection
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['data'], 'test.csv', { type: 'text/csv' });
    Object.defineProperty(fileInput, 'files', { value: [file], writable: false });
    fireEvent.change(fileInput);

    // Click upload button
    await waitFor(() => {
      const uploadBtn = screen.getByRole('button', { name: 'Upload CSV' });
      expect(uploadBtn).not.toBeDisabled();
    });

    const uploadBtn = screen.getByRole('button', { name: 'Upload CSV' });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      const summary = screen.getByTestId('validation-summary');
      expect(summary).toBeInTheDocument();
      expect(summary.textContent).toContain('15 of 20');
      expect(summary.textContent).toContain('5 errors');
    });
  });

  it('auto-navigates when upload has no errors', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        totalRows: 10,
        validRows: 10,
        errorRows: 0,
        sessionId: 'session-456',
        errors: [],
      }),
    });

    renderPage();

    // Simulate file selection
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['data'], 'test.csv', { type: 'text/csv' });
    Object.defineProperty(fileInput, 'files', { value: [file], writable: false });
    fireEvent.change(fileInput);

    await waitFor(() => {
      const uploadBtn = screen.getByRole('button', { name: 'Upload CSV' });
      expect(uploadBtn).not.toBeDisabled();
    });

    const uploadBtn = screen.getByRole('button', { name: 'Upload CSV' });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/bulk-issuance/preview/session-456');
    });
  });

  it('drag-over state applies blue border classes', () => {
    renderPage();
    
    const dropZone = screen.getByRole('button', { name: /upload csv file/i });

    fireEvent.dragEnter(dropZone, {
      dataTransfer: { files: [] },
    });

    expect(dropZone.className).toContain('border-blue-500');
    expect(dropZone.className).toContain('bg-blue-50');
  });
});
