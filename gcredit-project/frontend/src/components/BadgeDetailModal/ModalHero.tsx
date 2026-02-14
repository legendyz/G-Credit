import React from 'react';
import type { BadgeStatus } from '../../types/badge';

interface ModalHeroProps {
  badgeImage: string | null;
  badgeName: string;
  status: BadgeStatus;
  issuedAt: string;
  category: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
}

const ModalHero: React.FC<ModalHeroProps> = ({
  badgeImage,
  badgeName,
  status,
  issuedAt,
  category,
  visibility = 'PUBLIC',
}) => {
  const getStatusConfig = (status: BadgeStatus) => {
    switch (status) {
      case 'CLAIMED':
        return { label: '✅ Claimed', color: 'bg-green-100 text-green-800' };
      case 'PENDING':
        return { label: '🟡 Pending', color: 'bg-yellow-100 text-yellow-800' };
      case 'REVOKED':
        return { label: '🔒 Revoked', color: 'bg-red-100 text-red-800' };
      case 'EXPIRED':
        return { label: '⏰ Expired', color: 'bg-gray-100 text-gray-800' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const statusConfig = getStatusConfig(status);
  const formattedDate = new Date(issuedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <section className="px-6 py-8 bg-gradient-to-br from-blue-50 to-purple-50 border-b">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* AC 4.2: Badge image 256x256px */}
        <div className="flex-shrink-0">
          {badgeImage ? (
            <img
              src={badgeImage}
              alt={badgeName}
              className="w-64 h-64 object-cover rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-64 h-64 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg shadow-lg flex items-center justify-center">
              <span className="text-white text-8xl">🏆</span>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{badgeName}</h2>

          <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-4">
            {/* AC 4.2: Status badge */}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </span>

            {/* Story 11.4: Privacy indicator — reflects actual visibility */}
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                visibility === 'PUBLIC'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {visibility === 'PUBLIC' ? '🌐 Public' : '🔒 Private'}
            </span>
          </div>

          {/* AC 4.2: Category and issue date */}
          <div className="text-gray-600 space-y-1">
            <p className="text-sm">
              <span className="font-semibold">Category:</span> {category}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Issued:</span> {formattedDate}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModalHero;
