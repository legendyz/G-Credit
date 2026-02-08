import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BulkPreviewPage from '../BulkPreviewPage';

// Mock sub-components to isolate page logic
vi.mock('../BulkPreviewHeader', () => ({
  default: (props: { totalRows: number; validRows: number; errorRows: number }) => (
    <div data-testid="preview-header">
      Header: {props.totalRows}/{props.validRows}/{props.errorRows}
    </div>
  ),
}));

vi.mock('../BulkPreviewTable', () => ({
  default: (props: { validRows: number }) => (
    <div data-testid="preview-table">Table: {props.validRows} rows</div>
  ),
}));

vi.mock('../ErrorCorrectionPanel', () => ({
  default: (props: { errorCount: number }) => (
    <div data-testid="error-panel">Errors: {props.errorCount}</div>
  ),
}));

vi.mock('../ConfirmationModal', () => ({
  default: (props: { isOpen: boolean; badgeCount: number; onConfirm: () => void }) => (
    props.isOpen ? (
      <div data-testid="confirm-modal">
        Confirm {props.badgeCount}
        <button onClick={props.onConfirm}>Confirm and Issue</button>
      </div>
    ) : null
  ),
}));

vi.mock('../EmptyPreviewState', () => ({
  default: () => <div data-testid="empty-state">No Valid Badges</div>,
}));

vi.mock('../ProcessingComplete', () => ({
  default: (props: { success: number; failed: number }) => (
    <div data-testid="processing-complete">
      Done: {props.success} success, {props.failed} failed
    </div>
  ),
}));

vi.mock('../ProcessingModal', () => ({
  default: () => <div data-testid="processing-modal" />,
}));

const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

function renderWithRouter(sessionId: string = 'test-session-123') {
  return render(
    <MemoryRouter initialEntries={[`/admin/bulk-issuance/preview/${sessionId}`]}>
      <Routes>
        <Route
          path="/admin/bulk-issuance/preview/:sessionId"
          element={<BulkPreviewPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

const mockPreviewData = {
  sessionId: 'test-session-123',
  validRows: 10,
  errorRows: 2,
  totalRows: 12,
  errors: [
    { rowNumber: 3, badgeTemplateId: 'tmpl-bad', recipientEmail: 'bad@test.com', message: 'Not found' },
    { rowNumber: 5, badgeTemplateId: 'tmpl-bad2', recipientEmail: 'fail@test.com', message: 'Invalid' },
  ],
  status: 'VALIDATED',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  rows: [
    { rowNumber: 2, badgeTemplateId: 'tmpl-1', recipientEmail: 'a@test.com', isValid: true },
  ],
  summary: {
    byTemplate: [{ templateId: 'tmpl-1', templateName: 'Leadership', count: 10 }],
  },
};

describe('BulkPreviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
      'test-token',
    );
  });

  it('should render loading state', () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithRouter();
    expect(screen.getByText('Loading preview data...')).toBeInTheDocument();
  });

  it('should render error state for 403', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403 });
    renderWithRouter();
    await waitFor(() => {
      expect(
        screen.getByText('You do not have permission to access this session'),
      ).toBeInTheDocument();
    });
  });

  it('should render error state for 404', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });
    renderWithRouter();
    await waitFor(() => {
      expect(
        screen.getByText('Session not found or has expired'),
      ).toBeInTheDocument();
    });
  });

  it('should render preview with header and table', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPreviewData),
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('preview-header')).toBeInTheDocument();
      expect(screen.getByTestId('preview-table')).toBeInTheDocument();
    });
  });

  it('should show error panel when errors exist', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPreviewData),
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
  });

  it('should show empty state when zero valid rows', async () => {
    const emptyData = {
      ...mockPreviewData,
      validRows: 0,
      errorRows: 3,
      totalRows: 3,
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(emptyData),
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('should open confirmation modal on confirm click', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPreviewData),
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText(/Confirm Issuance/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Confirm Issuance/));
    await waitFor(() => {
      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    });
  });
});
