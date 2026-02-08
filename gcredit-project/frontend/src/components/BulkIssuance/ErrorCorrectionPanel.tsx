interface ErrorItem {
  rowNumber: number;
  badgeTemplateId: string;
  recipientEmail: string;
  message: string;
}

interface ErrorCorrectionPanelProps {
  errorCount: number;
  validCount: number;
  errors: ErrorItem[];
  onDownloadErrorReport: () => void;
  onReupload: () => void;
}

/**
 * Error correction panel with guided workflow (UX-P0-3)
 */
export default function ErrorCorrectionPanel({
  errorCount,
  validCount,
  errors,
  onDownloadErrorReport,
  onReupload,
}: ErrorCorrectionPanelProps) {
  return (
    <div className="mb-6">
      {/* Error Summary + Guided Workflow */}
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg mb-4">
        <h3 className="text-lg font-semibold text-red-700 mb-4">
          ⚠️ {errorCount} errors prevent badge issuance
        </h3>

        <div className="mb-4 text-gray-700">
          <p className="font-medium mb-2">To fix errors:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Click &quot;Download Error Report&quot; below</li>
            <li>Correct errors in your original CSV file</li>
            <li>Click &quot;Re-upload Fixed CSV&quot; to replace this upload</li>
          </ol>
        </div>

        {validCount > 0 && (
          <p className="text-sm text-gray-600 mb-4">
            Or: Continue with {validCount} valid badges ({errorCount} will be
            skipped)
          </p>
        )}

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={onDownloadErrorReport}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            📥 Download Error Report
          </button>
          <button
            onClick={onReupload}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            🔄 Re-upload Fixed CSV
          </button>
        </div>
      </div>

      {/* Error Details Table */}
      {errors.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Error Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Row #
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Template ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Error Message
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {errors.map((error, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {error.rowNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono truncate max-w-[200px]">
                      {error.badgeTemplateId}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {error.recipientEmail}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600">
                      {error.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
