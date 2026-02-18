import React from 'react';
import { Clock } from 'lucide-react';

interface ExpirationSectionProps {
  expiresAt: string;
}

/**
 * Expiration Details Section
 * Displays expiration information in badge detail modal for expired badges.
 * Uses neutral gray styling — UX Decision 2026-02-17: expired = neutral lifecycle event.
 */
const ExpirationSection: React.FC<ExpirationSectionProps> = ({ expiresAt }) => {
  const formattedDate = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="px-6 py-4 bg-gray-50 border-l-4 border-gray-400">
      <div className="flex items-start gap-3">
        <Clock className="h-6 w-6 text-gray-500 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-2">⏰ Badge Expired</h3>

          <p className="text-gray-700 mb-3">This badge expired on {formattedDate}</p>

          <p className="text-gray-500 text-sm">
            This badge has expired and is no longer valid for verification. The original badge
            information is shown below for historical reference.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExpirationSection;
