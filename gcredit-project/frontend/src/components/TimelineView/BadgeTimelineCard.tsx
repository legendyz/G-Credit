/**
 * Badge Timeline Card Component
 * Sprint 8 - Story 8.3: WCAG 2.1 AA Accessibility
 *
 * Keyboard accessible card with proper ARIA attributes.
 */

import { useCallback, useEffect, useState } from 'react';
import { Globe, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Badge } from '../../hooks/useWallet';
import { BadgeStatus } from '../../types/badge';
import { useBadgeDetailModal } from '../../stores/badgeDetailModal';
import { StatusBadge } from '../ui/StatusBadge';
import { apiFetch } from '../../lib/apiFetch';

interface BadgeTimelineCardProps {
  badge: Badge;
}

export function BadgeTimelineCard({ badge }: BadgeTimelineCardProps) {
  const { openModal } = useBadgeDetailModal();
  const queryClient = useQueryClient();
  const [isToggling, setIsToggling] = useState(false);
  const [localVisibility, setLocalVisibility] = useState(badge.visibility ?? 'PUBLIC');

  // Sync local state when wallet data refreshes (e.g. after modal toggle)
  useEffect(() => {
    setLocalVisibility(badge.visibility ?? 'PUBLIC');
  }, [badge.visibility]);

  const isRevoked = badge.status === BadgeStatus.REVOKED;

  const handleToggleVisibility = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsToggling(true);
    try {
      const newVisibility = localVisibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
      const res = await apiFetch(`/badges/${badge.id}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify({ visibility: newVisibility }),
      });
      if (!res.ok) throw new Error();
      setLocalVisibility(newVisibility);
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast.success(`Badge set to ${newVisibility === 'PUBLIC' ? 'Public' : 'Private'}`);
    } catch {
      toast.error('Failed to update visibility. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

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
      <div className="relative w-full">
        <div
          role="button"
          tabIndex={0}
          className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
            isRevoked ? 'opacity-50' : ''
          }`}
          aria-label={`${badge.template.name} badge, ${badge.status.toLowerCase()}${isRevoked && badge.revokedAt ? `, revoked on ${new Date(badge.revokedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}`}
          onClick={() => openModal(badge.id)}
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center gap-4">
            {/* Badge Image */}
            <img
              src={badge.template.imageUrl}
              alt={badge.template.name}
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
            />

            {/* Badge Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1 truncate">{badge.template.name}</h3>
              <p className="text-sm text-gray-600 mb-2 truncate">
                Issued by {badge.issuer.firstName} {badge.issuer.lastName}
              </p>

              {/* Status Badge - Story 8.3: WCAG AA compliant colors */}
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge
                  status={badge.status as 'CLAIMED' | 'PENDING' | 'REVOKED' | 'EXPIRED'}
                />

                {/* Category Tag */}
                <div className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                  {badge.template.category}
                </div>
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
            <div className="flex flex-col gap-2 flex-shrink-0">
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
              <button
                className="p-2 hover:bg-gray-100 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={`Badge visibility: ${localVisibility.toLowerCase()}`}
                title={localVisibility === 'PUBLIC' ? 'Set to Private' : 'Set to Public'}
                onClick={handleToggleVisibility}
                disabled={isToggling}
              >
                {isToggling ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-hidden="true" />
                ) : localVisibility === 'PUBLIC' ? (
                  <Globe className="h-4 w-4 text-gray-600" aria-hidden="true" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-600" aria-hidden="true" />
                )}
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
