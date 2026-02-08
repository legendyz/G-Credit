import React from 'react';

interface FilteredEmptyStateProps {
  currentFilter: string | null;
  onClearFilters: () => void;
}

const FilteredEmptyState: React.FC<FilteredEmptyStateProps> = ({
  currentFilter,
  onClearFilters,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* AC 6.11: Empty search illustration 128x128 (smaller) */}
      <div className="w-32 h-32 mb-6 flex items-center justify-center">
        <svg
          viewBox="0 0 128 128"
          className="w-full h-full text-gray-300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Magnifying glass */}
          <circle cx="48" cy="48" r="32" stroke="currentColor" strokeWidth="6" />
          <path d="M72 72 L96 96" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />

          {/* X mark inside */}
          <path d="M36 36 L60 60" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M60 36 L36 60" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>

      {/* AC 6.11: Heading */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
        No Badges Match This Filter
      </h2>

      {/* AC 6.11: Description */}
      <p className="text-base text-gray-600 max-w-lg mb-6">
        Try adjusting your filters or search terms.
      </p>

      {/* AC 6.12: Filter status indicator */}
      {currentFilter && (
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
          <span className="text-sm text-blue-700">
            Filtering by: <strong>{currentFilter}</strong>
          </span>
          <button
            onClick={onClearFilters}
            className="text-blue-600 hover:text-blue-800 font-bold"
            aria-label="Remove filter"
          >
            ✕
          </button>
        </div>
      )}

      {/* AC 6.11: Primary CTA */}
      <button
        onClick={onClearFilters}
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
      >
        🔄 Clear Filters
      </button>

      {/* Helpful suggestions */}
      <div className="mt-8 text-sm text-gray-500">
        <p>You can also try:</p>
        <ul className="mt-2 space-y-1">
          <li>• Viewing all badges</li>
          <li>• Checking a different status filter</li>
          <li>• Exploring the badge catalog for new opportunities</li>
        </ul>
      </div>
    </div>
  );
};

export default FilteredEmptyState;
