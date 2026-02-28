import React from 'react';

interface PendingBadgesEmptyStateProps {
  pendingCount: number;
  onViewPending: () => void;
}

const PendingBadgesEmptyState: React.FC<PendingBadgesEmptyStateProps> = ({
  pendingCount,
  onViewPending,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* AC 6.5: Gift box illustration 256x256 with subtle animation */}
      <div className="w-64 h-64 mb-8 flex items-center justify-center animate-bounce-slow">
        <svg
          viewBox="0 0 256 256"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Gift box */}
          <rect
            x="64"
            y="96"
            width="128"
            height="96"
            rx="4"
            fill="var(--color-gift-box)"
            stroke="var(--color-gift-box-dark)"
            strokeWidth="3"
          />
          <rect x="64" y="96" width="128" height="24" fill="var(--color-gift-box-dark)" />

          {/* Ribbon vertical */}
          <rect x="118" y="96" width="20" height="96" fill="var(--color-gift-ribbon)" />

          {/* Ribbon horizontal */}
          <rect x="64" y="106" width="128" height="12" fill="var(--color-gift-ribbon-dark)" />

          {/* Bow top */}
          <ellipse cx="108" cy="90" rx="14" ry="20" fill="var(--color-gift-ribbon)" />
          <ellipse cx="148" cy="90" rx="14" ry="20" fill="var(--color-gift-ribbon)" />
          <circle cx="128" cy="96" r="10" fill="var(--color-gift-ribbon-dark)" />

          {/* Sparkles */}
          <circle cx="48" cy="72" r="4" fill="var(--color-gift-box)" className="animate-pulse" />
          <circle cx="208" cy="128" r="4" fill="var(--color-gift-box)" className="animate-pulse" />
          <circle
            cx="220"
            cy="88"
            r="3"
            fill="var(--color-gift-box-dark)"
            className="animate-pulse"
          />
        </svg>
      </div>

      {/* AC 6.5: Heading - Exciting tone */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        You Have Badges Waiting! 🎉
      </h1>

      {/* AC 6.5: Description with dynamic count */}
      <p className="text-base md:text-lg text-gray-600 max-w-2xl mb-8">
        You've been awarded <strong className="text-yellow-600">{pendingCount}</strong> badge
        {pendingCount > 1 ? 's' : ''}. Review and claim them to add to your profile.
      </p>

      {/* AC 6.5: Primary CTA with badge count indicator */}
      <div className="relative">
        <button
          onClick={onViewPending}
          className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold text-lg rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          🎁 View Pending Badges
        </button>
        {/* Badge count bubble */}
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center animate-pulse">
          {pendingCount}
        </span>
      </div>

      {/* Urgency indicator */}
      <div className="mt-12 p-6 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg max-w-2xl">
        <p className="text-sm text-yellow-800">
          <strong>⏰ Don't forget:</strong> Some badges may have claim deadlines. Review your
          pending badges soon to ensure you don't miss out!
        </p>
      </div>
    </div>
  );
};

export default PendingBadgesEmptyState;
