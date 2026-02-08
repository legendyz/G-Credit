interface BadgeResult {
  row: number;
  recipientEmail: string;
  badgeName: string;
  status: 'success' | 'failed';
  error?: string;
}

interface ProcessingCompleteProps {
  success: number;
  failed: number;
  results: BadgeResult[];
  sessionId?: string;
  onViewBadges: () => void;
}

/**
 * Processing completion view showing success/failure counts
 * and detailed failed badges table when applicable
 */
export default function ProcessingComplete({
  success,
  failed,
  results,
  sessionId,
  onViewBadges,
}: ProcessingCompleteProps) {
  const failedResults = results.filter((r) => r.status === 'failed');

  const handleDownloadErrorReport = async () => {
    if (!sessionId) return;
    try {
      const response = await fetch(
        `/api/bulk-issuance/error-report/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to download error report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `errors-${sessionId.substring(0, 8)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Failed to download error report');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">{failed === 0 ? '✅' : '⚠️'}</div>
        <h2 className="text-2xl font-bold mb-4">
          {failed === 0 ? 'Issuance Complete' : 'Issuance Complete (Partial Failure)'}
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-600 font-bold text-3xl">{success}</p>
            <p className="text-green-700">Issued Successfully</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-red-600 font-bold text-3xl">{failed}</p>
            <p className="text-red-700">Failed</p>
          </div>
        </div>

        {/* Failed Badges Table */}
        {failedResults.length > 0 && (
          <div className="mb-6 text-left">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Failed Badges
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-600">Row</th>
                    <th className="px-3 py-2 text-left text-gray-600">Recipient</th>
                    <th className="px-3 py-2 text-left text-gray-600">Badge</th>
                    <th className="px-3 py-2 text-left text-gray-600">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {failedResults.map((r) => (
                    <tr key={r.row} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-700">{r.row}</td>
                      <td className="px-3 py-2 text-gray-700">{r.recipientEmail}</td>
                      <td className="px-3 py-2 text-gray-700">{r.badgeName}</td>
                      <td className="px-3 py-2 text-red-600 text-xs">{r.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sessionId && (
              <button
                onClick={handleDownloadErrorReport}
                className="mt-3 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Download Error Report
              </button>
            )}
          </div>
        )}

        <button
          onClick={onViewBadges}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {failed === 0 ? 'View Issued Badges' : 'Return to Dashboard'}
        </button>
      </div>
    </div>
  );
}
