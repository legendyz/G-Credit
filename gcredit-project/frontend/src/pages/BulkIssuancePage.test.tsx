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
    expect(screen.getByText(/\.csv files up to 100KB/i)).toBeInTheDocument();
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
});
