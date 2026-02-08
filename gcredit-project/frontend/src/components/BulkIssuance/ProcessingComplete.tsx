interface ProcessingCompleteProps {
  success: number;
  failed: number;
  onViewBadges: () => void;
}

/**
 * Processing completion view showing success/failure counts
 */
export default function ProcessingComplete({
  success,
  failed,
  onViewBadges,
}: ProcessingCompleteProps) {
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
        <button
          onClick={onViewBadges}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Issued Badges
        </button>
      </div>
    </div>
  );
}
