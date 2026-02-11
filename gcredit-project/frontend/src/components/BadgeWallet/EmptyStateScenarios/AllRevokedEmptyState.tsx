import React from 'react';

interface AllRevokedEmptyStateProps {
  onContactSupport: () => void;
  onViewPolicy: () => void;
}

const AllRevokedEmptyState: React.FC<AllRevokedEmptyStateProps> = ({
  onContactSupport,
  onViewPolicy,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* AC 6.8: Alert circle illustration 256x256 - neutral color */}
      <div className="w-64 h-64 mb-8 flex items-center justify-center">
        <svg
          viewBox="0 0 256 256"
          className="w-full h-full text-gray-400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Circle */}
          <circle cx="128" cy="128" r="96" stroke="currentColor" strokeWidth="6" />

          {/* Alert symbol */}
          <path d="M128 80 L128 144" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          <circle cx="128" cy="172" r="6" fill="currentColor" />
        </svg>
      </div>

      {/* AC 6.8: Heading - Neutral, professional tone */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        Your Badge Wallet is Currently Empty
      </h1>

      {/* AC 6.8: Description - Not accusatory */}
      <p className="text-base md:text-lg text-gray-600 max-w-2xl mb-8">
        All your badges have been revoked. If you believe this is an error, please contact support
        at{' '}
        <a
          href="mailto:g-credit@outlook.com"
          className="text-blue-600 hover:text-blue-700 underline"
        >
          g-credit@outlook.com
        </a>
        .
      </p>

      {/* AC 6.8: Primary and Secondary CTAs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onContactSupport}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          📧 Contact Support
        </button>
        <button
          onClick={onViewPolicy}
          className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
        >
          📄 View Revocation Policy
        </button>
      </div>

      {/* Supportive additional information */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg max-w-2xl border border-gray-200">
        <p className="text-sm text-gray-700">
          <strong>What happens next?</strong> Our support team will review your inquiry and respond
          within 2 business days. Badge revocations follow our organization's credential management
          policy.
        </p>
      </div>
    </div>
  );
};

export default AllRevokedEmptyState;
