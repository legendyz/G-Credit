import { useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface PreviewTableRow {
  rowNumber: number;
  badgeTemplateId: string;
  badgeName?: string;
  recipientEmail: string;
  recipientName?: string;
  isValid: boolean;
}

interface BulkPreviewTableProps {
  rows: PreviewTableRow[];
  validRows: number;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

/**
 * Data table for valid preview rows with search, filter, and pagination (AC2, UX-P1-5)
 */
export default function BulkPreviewTable({ rows, validRows }: BulkPreviewTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [templateFilter, setTemplateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Only valid rows
  const validRowsList = useMemo(() => rows.filter((r) => r.isValid), [rows]);

  // Unique template names for filter dropdown
  const templateNames = useMemo(() => {
    const names = new Set<string>();
    for (const row of validRowsList) {
      names.add(row.badgeName ?? row.badgeTemplateId);
    }
    return [...names].sort();
  }, [validRowsList]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    let result = validRowsList;

    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      result = result.filter(
        (r) =>
          (r.recipientName ?? '').toLowerCase().includes(search) ||
          r.recipientEmail.toLowerCase().includes(search)
      );
    }

    if (templateFilter) {
      result = result.filter((r) => (r.badgeName ?? r.badgeTemplateId) === templateFilter);
    }

    return result;
  }, [validRowsList, debouncedSearch, templateFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (safeCurrentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filteredRows.length);
  const pageRows = filteredRows.slice(startIdx, endIdx);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleTemplateFilterChange = (value: string) => {
    setTemplateFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-3">Badges to Issue ({validRows})</h3>

        {/* Search and Filter Controls */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by recipient name or email..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search recipients"
          />
          <select
            value={templateFilter}
            onChange={(e) => handleTemplateFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filter by template"
          >
            <option value="">All Templates</option>
            {templateNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Badge Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                Recipient Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                Recipient Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pageRows.map((row) => (
              <tr key={row.rowNumber} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-800">
                  {row.badgeName ?? row.badgeTemplateId}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {row.recipientName ?? row.recipientEmail}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.recipientEmail}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Valid
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            Showing {filteredRows.length > 0 ? startIdx + 1 : 0}-{endIdx} of {filteredRows.length}{' '}
            badges
          </span>
          <span className="text-gray-400">|</span>
          <label htmlFor="pageSize" className="sr-only">
            Rows per page
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
            aria-label="Rows per page"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage <= 1}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {safeCurrentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage >= totalPages}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
