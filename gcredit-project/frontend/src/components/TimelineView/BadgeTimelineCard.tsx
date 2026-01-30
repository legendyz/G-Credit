import type { Badge } from '../../hooks/useWallet';
import { BadgeStatus } from '../../types/badge';
import { useBadgeDetailModal } from '../../stores/badgeDetailModal';

interface BadgeTimelineCardProps {
  badge: Badge;
}

export function BadgeTimelineCard({ badge }: BadgeTimelineCardProps) {
  const { openModal } = useBadgeDetailModal();
  const getStatusColor = (status: BadgeStatus) => {
    switch (status) {
      case BadgeStatus.CLAIMED:
        return 'bg-green-500';
      case BadgeStatus.PENDING:
        return 'bg-yellow-500';
      case BadgeStatus.REVOKED:
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusLabel = (status: BadgeStatus) => {
    switch (status) {
      case BadgeStatus.CLAIMED:
        return '✅ Claimed';
      case BadgeStatus.PENDING:
        return '🟡 Pending';
      case BadgeStatus.REVOKED:
        return '🔒 Revoked';
      default:
        return status;
    }
  };

  return (
    <div className="relative flex items-start gap-4 pl-16">
      {/* Timeline Dot - AC 1.2 */}
      <div
        className={`absolute left-[26px] w-4 h-4 rounded-full border-2 border-white ${getStatusColor(badge.status)}`}
        aria-label={`Badge status: ${badge.status}`}
      />

      {/* Card Content - AC 1.4 */}
      <div 
        className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => openModal(badge.id)}
      >
        <div className="flex gap-4">
          {/* Badge Image */}
          <img
            src={badge.template.imageUrl}
            alt={badge.template.name}
            className="w-32 h-32 object-contain flex-shrink-0"
          />

          {/* Badge Info */}
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{badge.template.name}</h3>
            <p className="text-sm text-gray-600 mb-2">
              Issued by {badge.issuer.firstName} {badge.issuer.lastName}
            </p>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm mb-2">
              {getStatusLabel(badge.status)}
            </div>

            {/* Category Tag */}
            <div className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm ml-2">
              {badge.template.category}
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex flex-col gap-2">
            <button
              className="p-2 hover:bg-gray-100 rounded"
              aria-label="View badge details"
              title="View Details"
              onClick={(e) => {
                e.stopPropagation();
                openModal(badge.id);
              }}
            >
              👁️
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded"
              aria-label="Download badge"
              title="Download"
              onClick={(e) => e.stopPropagation()}
            >
              ⬇️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
