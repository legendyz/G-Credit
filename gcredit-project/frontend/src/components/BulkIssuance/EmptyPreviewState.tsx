interface EmptyPreviewStateProps {
  onReupload: () => void;
}

/**
 * Empty state component for when CSV has zero valid rows (AC6)
 */
export default function EmptyPreviewState({
  onReupload,
}: EmptyPreviewStateProps) {
  return (
    <div className="max-w-md mx-auto p-8 text-center">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          No Valid Badges
        </h2>
        <p className="text-gray-600 mb-6">
          No valid badges found in CSV file. Please check the template format
          and try again.
        </p>
        <button
          onClick={onReupload}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          🔄 Re-upload CSV
        </button>
      </div>
    </div>
  );
}
