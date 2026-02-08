import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BulkPreviewTable from '../BulkPreviewTable';

// Mock useDebounce to return value immediately in tests
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
  default: (value: string) => value,
}));

describe('BulkPreviewTable', () => {
  const mockRows = [
    {
      rowNumber: 2,
      badgeTemplateId: 'tmpl-1',
      badgeName: 'Leadership',
      recipientEmail: 'alice@company.com',
      recipientName: 'Alice Smith',
      evidenceUrl: 'https://example.com/e1',
      isValid: true,
    },
    {
      rowNumber: 3,
      badgeTemplateId: 'tmpl-1',
      badgeName: 'Leadership',
      recipientEmail: 'bob@company.com',
      recipientName: 'Bob Jones',
      isValid: true,
    },
    {
      rowNumber: 4,
      badgeTemplateId: 'tmpl-2',
      badgeName: 'Innovation',
      recipientEmail: 'carol@company.com',
      recipientName: 'Carol White',
      isValid: true,
    },
    {
      rowNumber: 5,
      badgeTemplateId: 'tmpl-err',
      recipientEmail: 'fail@company.com',
      isValid: false,
      error: 'Template not found',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render table with correct columns', () => {
    render(<BulkPreviewTable rows={mockRows} validRows={3} />);

    expect(screen.getByText('Badge Name')).toBeInTheDocument();
    expect(screen.getByText('Recipient Name')).toBeInTheDocument();
    expect(screen.getByText('Recipient Email')).toBeInTheDocument();
    expect(screen.getByText('Evidence URL')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should only show valid rows', () => {
    render(<BulkPreviewTable rows={mockRows} validRows={3} />);

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('Carol White')).toBeInTheDocument();
    // Invalid row should not appear
    expect(screen.queryByText('fail@company.com')).not.toBeInTheDocument();
  });

  it('should filter by recipient name via search', () => {
    render(<BulkPreviewTable rows={mockRows} validRows={3} />);

    const searchInput = screen.getByLabelText('Search recipients');
    fireEvent.change(searchInput, { target: { value: 'alice' } });

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
    expect(screen.queryByText('Carol White')).not.toBeInTheDocument();
  });

  it('should filter by recipient email via search', () => {
    render(<BulkPreviewTable rows={mockRows} validRows={3} />);

    const searchInput = screen.getByLabelText('Search recipients');
    fireEvent.change(searchInput, { target: { value: 'bob@' } });

    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
  });

  it('should filter by template name', () => {
    render(<BulkPreviewTable rows={mockRows} validRows={3} />);

    const filterSelect = screen.getByLabelText('Filter by template');
    fireEvent.change(filterSelect, { target: { value: 'Innovation' } });

    expect(screen.getByText('Carol White')).toBeInTheDocument();
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
  });

  it('should change page size via rows-per-page selector', () => {
    // Create enough rows to test pagination
    const manyRows = Array.from({ length: 15 }, (_, i) => ({
      rowNumber: i + 2,
      badgeTemplateId: 'tmpl-1',
      badgeName: 'Leadership',
      recipientEmail: `user${i}@company.com`,
      recipientName: `User ${i}`,
      isValid: true,
    }));

    render(<BulkPreviewTable rows={manyRows} validRows={15} />);

    const pageSizeSelect = screen.getByLabelText('Rows per page');
    fireEvent.change(pageSizeSelect, { target: { value: '10' } });

    // Should show "Showing 1-10 of 15 badges"
    expect(screen.getByText(/Showing 1-10 of 15 badges/)).toBeInTheDocument();
  });
});
