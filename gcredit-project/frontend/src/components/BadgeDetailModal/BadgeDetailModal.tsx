import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useBadgeDetailModal } from '../../stores/badgeDetailModal';
import type { BadgeDetail } from '../../types/badge';
import { BadgeStatus } from '../../types/badge';
import ModalHero from './ModalHero';
import BadgeInfo from './BadgeInfo';
import TimelineSection from './TimelineSection';
import VerificationSection from './VerificationSection';
import EvidenceSection from './EvidenceSection';
import SimilarBadgesSection from './SimilarBadgesSection';
import ReportIssueForm from './ReportIssueForm';
import BadgeAnalytics from './BadgeAnalytics';
import BadgeShareModal from '../BadgeShareModal';
import RevocationSection from './RevocationSection';
import ClaimSuccessModal from '../ClaimSuccessModal';
import { Globe, Lock, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/apiFetch';
import { useCurrentUser } from '../../stores/authStore';
import { useSkillNamesMap } from '../../hooks/useSkills';

const BadgeDetailModal: React.FC = () => {
  const { isOpen, badgeId, closeModal } = useBadgeDetailModal();
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();
  const [badge, setBadge] = useState<BadgeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccessOpen, setClaimSuccessOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [localVisibility, setLocalVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');

  // Resolve skill UUIDs to human-readable names
  const skillNamesMap = useSkillNamesMap(badge?.template?.skillIds);
  // Story 11.24 AC-M13: Fallback to 'Unknown Skill' instead of raw UUID
  const resolvedSkillNames = (badge?.template?.skillIds || []).map(
    (id) => skillNamesMap[id] || 'Unknown Skill'
  );

  useEffect(() => {
    if (!isOpen || !badgeId) return;

    const fetchBadgeDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFetch(`/badges/${badgeId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch badge details');
        }

        const data = await response.json();
        setBadge(data);
        setLocalVisibility(data.visibility ?? 'PUBLIC');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchBadgeDetails();
  }, [isOpen, badgeId]);

  // AC 4.14: Keyboard navigation - Escape key closes modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeModal]);

  // Sprint 6: Download badge as PNG (Story 6.4 - Baked Badge)
  const handleDownloadBadge = async () => {
    if (!badge) return;

    setDownloading(true);
    try {
      const response = await apiFetch(`/badges/${badge.id}/download/png`);

      if (!response.ok) {
        throw new Error('Failed to download badge');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${badge.template.name.replace(/\s+/g, '-')}-badge.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast.error('Download failed', {
        description: 'Unable to download badge. Please try again.',
      });
    } finally {
      setDownloading(false);
    }
  };

  // Story 11.4: Toggle badge visibility (PUBLIC/PRIVATE)
  const handleToggleVisibility = async () => {
    if (!badge) return;
    setIsToggling(true);
    try {
      const newVisibility = localVisibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
      const res = await apiFetch(`/badges/${badge.id}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify({ visibility: newVisibility }),
      });
      if (!res.ok) throw new Error();
      setLocalVisibility(newVisibility);
      // Invalidate wallet queries so the list reflects the new visibility
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast.success(`Badge set to ${newVisibility === 'PUBLIC' ? 'Public' : 'Private'}`);
    } catch {
      toast.error('Failed to update visibility. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  // UX-P0-004: Claim badge functionality
  const handleClaimBadge = async () => {
    if (!badge || badge.status !== BadgeStatus.PENDING) return;

    setClaiming(true);
    try {
      const response = await apiFetch(`/badges/${badge.id}/claim`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to claim badge');
      }

      // Parse response (we don't need the full badge, just confirmation)
      await response.json();

      // Update local badge state
      setBadge((prev) =>
        prev ? { ...prev, status: BadgeStatus.CLAIMED, claimedAt: new Date().toISOString() } : null
      );

      // Show celebration modal
      setClaimSuccessOpen(true);

      toast.success('Badge claimed!', {
        description: `You've successfully claimed the ${badge.template.name} badge.`,
      });
    } catch (err) {
      toast.error('Claim failed', {
        description:
          err instanceof Error ? err.message : 'Unable to claim badge. Please try again.',
      });
    } finally {
      setClaiming(false);
    }
  };

  // AC 4.15: Click backdrop closes modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // Don't render anything if modal is closed
  if (!isOpen) return null;

  return (
    <>
      {/* Story 8.5: Responsive modal - full screen on mobile, centered on desktop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-0 md:p-4"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* AC1: Full screen on mobile (<768px), AC2-3: Centered max-width on tablet/desktop */}
        <div
          className="bg-white md:rounded-lg shadow-2xl 
                     w-full h-full md:h-auto md:max-h-[90vh] md:max-w-3xl
                     overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* AC 4.1: Header with close button - Story 8.5: Touch-friendly close button */}
          <header className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
            <h1 id="modal-title" className="text-lg md:text-xl font-bold text-gray-900">
              Badge Details
            </h1>
            <button
              onClick={closeModal}
              className="flex items-center justify-center w-11 h-11 -mr-2
                         text-gray-500 hover:text-gray-700 hover:bg-gray-100 
                         active:bg-gray-200 rounded-full transition-all"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </header>

          {/* AC 4.16: Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full w-12 h-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {error && (
              <div className="p-4 md:p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">Error: {error}</p>
                </div>
              </div>
            )}

            {badge && (
              <>
                {/* AC 4.2: Hero Section */}
                <ModalHero
                  badgeImage={badge.template.imageUrl}
                  badgeName={badge.template.name}
                  status={badge.status}
                  issuedAt={badge.issuedAt}
                  category={badge.template.category}
                  visibility={localVisibility}
                />

                {/* AC 4.4: Badge Info */}
                <BadgeInfo
                  description={badge.template.description}
                  skills={resolvedSkillNames}
                  criteria={badge.template.issuanceCriteria}
                />

                {/* AC 4.4: Evidence Files Section (from Story 4.3) */}
                <EvidenceSection badgeId={badge.id} />

                {/* Story 9.3 AC2: Revocation Details Section */}
                {badge.status === BadgeStatus.REVOKED &&
                  badge.revokedAt &&
                  badge.revocationReason && (
                    <RevocationSection
                      revokedAt={badge.revokedAt}
                      revocationReason={badge.revocationReason}
                      revocationNotes={badge.revocationNotes}
                      isPublicReason={badge.isPublicReason || false}
                      revokedBy={badge.revokedBy}
                    />
                  )}

                {/* AC 4.5: Timeline Section */}
                <TimelineSection
                  issuedAt={badge.issuedAt}
                  claimedAt={badge.claimedAt}
                  expiresAt={badge.expiresAt}
                />

                {/* AC 4.6: Verification Section */}
                <VerificationSection verificationId={badge.verificationId} />

                {/* Sprint 6: Badge Share Analytics (Story 7.5) */}
                <BadgeAnalytics
                  badgeId={badge.id}
                  isOwner={badge.recipient.email === currentUser?.email}
                />

                {/* AC 4.7: Similar Badges Section (from Story 4.5) */}
                <SimilarBadgesSection
                  badgeId={badge.id}
                  onBadgeClick={(templateId) => {
                    // For MVP: open in new tab (future: open template details modal)
                    window.open(`/badges/templates/${templateId}`, '_blank');
                  }}
                />

                {/* AC 4.8-4.11: Report Issue Form */}
                <ReportIssueForm
                  badgeId={badge.id}
                  userEmail={badge.recipient.email}
                  onSuccess={() => {
                    toast.success('Report submitted successfully');
                  }}
                />
              </>
            )}
          </div>

          {/* AC 4.8: Action Footer (Share/Download/Claim buttons) | Story 9.3 AC3: Disable for revoked badges */}
          <footer className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center flex-wrap gap-2">
            {/* UX-P0-004: Claim Button for PENDING badges */}
            {badge?.status === BadgeStatus.PENDING && (
              <button
                onClick={handleClaimBadge}
                disabled={claiming}
                title={claiming ? 'Claiming...' : 'Claim this badge'}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg flex items-center border-none transition-colors hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {claiming ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Claiming...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Claim Badge
                  </>
                )}
              </button>
            )}

            {/* Story 11.4: Visibility toggle */}
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <span>Visibility:</span>
              <button
                onClick={handleToggleVisibility}
                disabled={isToggling}
                className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-200 bg-transparent text-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed"
                title={localVisibility === 'PUBLIC' ? 'Set to Private' : 'Set to Public'}
                aria-label={`Badge visibility: ${localVisibility.toLowerCase()}`}
              >
                {isToggling ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : localVisibility === 'PUBLIC' ? (
                  <>
                    <Globe className="h-4 w-4" aria-hidden="true" /> Public
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" aria-hidden="true" /> Private
                  </>
                )}
              </button>
            </div>

            {/* Story 9.3 AC3: Disable Share button for revoked badges */}
            <button
              onClick={() => setShareModalOpen(true)}
              disabled={
                badge?.status === BadgeStatus.REVOKED || badge?.status === BadgeStatus.PENDING
              }
              title={
                badge?.status === BadgeStatus.REVOKED
                  ? 'Revoked badges cannot be shared'
                  : badge?.status === BadgeStatus.PENDING
                    ? 'Claim this badge before sharing'
                    : 'Share this badge'
              }
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg flex items-center border-none transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share Badge
            </button>
            {/* Story 9.3 AC3: Download button disabled for revoked badges (PO decision: prevent misuse of revoked credential PNG) */}
            <button
              onClick={handleDownloadBadge}
              disabled={downloading || badge?.status === BadgeStatus.REVOKED}
              title={
                badge?.status === BadgeStatus.REVOKED
                  ? 'Revoked badges cannot be downloaded'
                  : downloading
                    ? 'Downloading...'
                    : 'Download badge as PNG'
              }
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg flex items-center border-none transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download PNG
                </>
              )}
            </button>
          </footer>
        </div>
      </div>

      {/* Sprint 6: Badge Share Modal (Story 7.2, 7.3, 7.4) */}
      {badge && (
        <BadgeShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          badgeId={badge.id}
          badgeName={badge.template.name}
          verificationId={badge.verificationId}
        />
      )}

      {/* UX-P0-004: Badge Claim Celebration Modal */}
      {badge && (
        <ClaimSuccessModal
          isOpen={claimSuccessOpen}
          onClose={() => {
            setClaimSuccessOpen(false);
            closeModal();
          }}
          badgeName={badge.template.name}
        />
      )}
    </>
  );
};

export default BadgeDetailModal;
