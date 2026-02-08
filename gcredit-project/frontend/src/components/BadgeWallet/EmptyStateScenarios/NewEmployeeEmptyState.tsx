import React from 'react';

interface NewEmployeeEmptyStateProps {
  onExploreCatalog: () => void;
  onLearnMore: () => void;
}

const NewEmployeeEmptyState: React.FC<NewEmployeeEmptyStateProps> = ({
  onExploreCatalog,
  onLearnMore,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* AC 6.2: Empty badge wallet illustration 256x256 */}
      <div className="w-64 h-64 mb-8 flex items-center justify-center">
        <svg
          viewBox="0 0 256 256"
          className="w-full h-full text-gray-300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="48"
            y="64"
            width="160"
            height="128"
            rx="8"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path d="M48 96 L208 96" stroke="currentColor" strokeWidth="4" />
          <circle cx="128" cy="140" r="24" stroke="currentColor" strokeWidth="4" />
          <path d="M128 116 L128 164" stroke="currentColor" strokeWidth="4" />
          <path d="M104 140 L152 140" stroke="currentColor" strokeWidth="4" />
        </svg>
      </div>

      {/* AC 6.2: Heading H1 32px */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        Welcome to Your Badge Wallet!
      </h1>

      {/* AC 6.2: Description - Educational tone */}
      <p className="text-base md:text-lg text-gray-600 max-w-2xl mb-8">
        Badges are digital credentials that recognize your skills and achievements. Start earning
        badges by completing learning programs.
      </p>

      {/* AC 6.2: Primary and Secondary CTAs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onExploreCatalog}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          🔍 Explore Badge Catalog
        </button>
        <button
          onClick={onLearnMore}
          className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
        >
          📚 Learn How to Earn
        </button>
      </div>

      {/* Additional helpful info */}
      <div className="mt-12 p-6 bg-blue-50 rounded-lg max-w-2xl">
        <p className="text-sm text-blue-800">
          <strong>💡 Getting Started:</strong> Badges are awarded by completing training programs,
          achieving milestones, or demonstrating specific skills. Check with your manager or visit
          the badge catalog to see available opportunities.
        </p>
      </div>
    </div>
  );
};

export default NewEmployeeEmptyState;
