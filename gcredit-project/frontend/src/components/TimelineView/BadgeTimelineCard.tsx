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
import { updateBadgeVisibility } from '../../lib/badgesApi';

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
  const isExpired = badge.status === BadgeStatus.EXPIRED;
  const isInactive = isRevoked || isExpired;

  const handleToggleVisibility = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsToggling(true);
    try {
      const newVisibility = localVisibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
      await updateBadgeVisibility(badge.id, newVisibility);
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
      case BadgeStatus.EXPIRED:
        return 'bg-gray-400';
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
            isInactive ? 'opacity-50' : ''
          }`}
          aria-label={`${badge.template.name} badge, ${badge.status.toLowerCase()}${isRevoked && badge.revokedAt ? `, revoked on ${new Date(badge.revokedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}`}
          onClick={() => openModal(badge.id)}
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center gap-4">
            {/* Badge Image — Story 11.24 AC-M9: fallback for null imageUrl */}
            {badge.template.imageUrl ? (
              <img
                src={badge.template.imageUrl}
                alt={badge.template.name}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
            )}

            {/* Badge Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1 truncate">{badge.template.name}</h3>
              <p className="text-sm text-gray-600 mb-1 truncate">
                Issued by {badge.issuer.firstName} {badge.issuer.lastName}
              </p>
              <p className="text-xs text-gray-500 mb-2">
                {new Date(badge.issuedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>

              {/* Status Badge - Story 8.3: WCAG AA compliant colors */}
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge
                  status={badge.status as 'CLAIMED' | 'PENDING' | 'REVOKED' | 'EXPIRED'}
                />

                {/* Category Tag — Story 11.24 AC-L14: title case */}
                <div className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                  {badge.template.category.charAt(0).toUpperCase() +
                    badge.template.category.slice(1).toLowerCase()}
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

              {/* Show expiry date for expired badges */}
              {badge.status === BadgeStatus.EXPIRED && badge.expiresAt && (
                <p className="text-sm text-gray-500 mt-2">
                  Expired on{' '}
                  {new Date(badge.expiresAt).toLocaleDateString('en-US', {
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

        {/* Gray "EXPIRED" banner overlay — UX Decision 2026-02-17: neutral gray for expired */}
        {isExpired && (
          <div className="absolute top-2 right-2 bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
            ⏰ EXPIRED
          </div>
        )}
      </div>
    </div>
  );
}
