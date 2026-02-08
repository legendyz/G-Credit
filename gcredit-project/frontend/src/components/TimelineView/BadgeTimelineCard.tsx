/**
 * Badge Timeline Card Component
 * Sprint 8 - Story 8.3: WCAG 2.1 AA Accessibility
 *
 * Keyboard accessible card with proper ARIA attributes.
 */

import { useCallback } from 'react';
import type { Badge } from '../../hooks/useWallet';
import { BadgeStatus } from '../../types/badge';
import { useBadgeDetailModal } from '../../stores/badgeDetailModal';
import { StatusBadge } from '../ui/StatusBadge';

interface BadgeTimelineCardProps {
  badge: Badge;
}

export function BadgeTimelineCard({ badge }: BadgeTimelineCardProps) {
  const { openModal } = useBadgeDetailModal();

  const isRevoked = badge.status === BadgeStatus.REVOKED;

  const getStatusColor = (status: BadgeStatus) => {
    switch (status) {
      case BadgeStatus.CLAIMED:
        return 'bg-green-600'; // WCAG AA compliant
      case BadgeStatus.PENDING:
        return 'bg-amber-600'; // WCAG AA compliant
      case BadgeStatus.REVOKED:
        return 'bg-red-600';
      default:
        return 'bg-gray-500';
    }
  };

  // Story 8.3: Keyboard handler for Enter/Space activation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(badge.id);
      }
    },
    [openModal, badge.id]
  );

  return (
    <div className="relative flex items-start gap-4 pl-16">
      {/* Timeline Dot - AC 1.2 */}
      <div
        className={`absolute left-[26px] w-4 h-4 rounded-full border-2 border-white ${getStatusColor(badge.status)}`}
        aria-hidden="true"
      />

      {/* Card Content - Story 8.3: Keyboard accessible */}
      <div className="relative">
        <div
          role="button"
          tabIndex={0}
          className={`flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
            isRevoked ? 'opacity-50' : ''
          }`}
          aria-label={`${badge.template.name} badge, ${badge.status.toLowerCase()}${isRevoked && badge.revokedAt ? `, revoked on ${new Date(badge.revokedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}`}
          onClick={() => openModal(badge.id)}
          onKeyDown={handleKeyDown}
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

              {/* Status Badge - Story 8.3: WCAG AA compliant colors */}
              <StatusBadge
                status={badge.status as 'CLAIMED' | 'PENDING' | 'REVOKED' | 'EXPIRED'}
                className="mb-2"
              />

              {/* Category Tag */}
              <div className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm ml-2">
                {badge.template.category}
              </div>

              {/* Story 9.3 AC1: Show revoked date if available */}
              {isRevoked && badge.revokedAt && (
                <p className="text-sm text-red-600 mt-2">
                  Revoked on{' '}
                  {new Date(badge.revokedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
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

        {/* Story 9.3 AC1: Red "REVOKED" banner overlay */}
        {isRevoked && (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
            🚫 REVOKED
          </div>
        )}
      </div>
    </div>
  );
}
