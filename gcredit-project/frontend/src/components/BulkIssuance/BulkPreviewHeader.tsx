import SessionExpiryTimer from './SessionExpiryTimer';

interface TemplateBreakdownItem {
  templateName: string;
  count: number;
}

interface BulkPreviewHeaderProps {
  totalRows: number;
  validRows: number;
  errorRows: number;
  templateBreakdown: TemplateBreakdownItem[];
  expiresAt: string;
  onExpired: () => void;
}

/**
 * Preview summary header with stats, template breakdown, and session timer (AC1)
 */
export default function BulkPreviewHeader({
  totalRows,
  validRows,
  errorRows,
  templateBreakdown,
  expiresAt,
  onExpired,
}: BulkPreviewHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Bulk Issuance Preview — {totalRows} Badges
        </h1>
        <SessionExpiryTimer expiresAt={expiresAt} onExpired={onExpired} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-gray-800">{totalRows}</p>
          <p className="text-gray-600 text-sm">Total Records</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{validRows}</p>
          <p className="text-green-700 text-sm">✅ Valid</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{errorRows}</p>
          <p className="text-red-700 text-sm">❌ Errors</p>
        </div>
      </div>

      {/* Template Breakdown Pills */}
      {templateBreakdown.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 font-medium self-center">Templates:</span>
          {templateBreakdown.map((item) => (
            <span
              key={item.templateName}
              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
            >
              {item.templateName}: {item.count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
