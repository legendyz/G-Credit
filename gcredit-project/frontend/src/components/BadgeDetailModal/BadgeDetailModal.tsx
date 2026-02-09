import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useBadgeDetailModal } from '../../stores/badgeDetailModal';
import type { BadgeDetail } from '../../types/badge';
import { BadgeStatus } from '../../types/badge';
import ModalHero from './ModalHero';
import IssuerMessage from './IssuerMessage';
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
import { API_BASE_URL } from '../../lib/apiConfig';
import { useCurrentUser } from '../../stores/authStore';

const BadgeDetailModal: React.FC = () => {
  const { isOpen, badgeId, closeModal } = useBadgeDetailModal();
  const currentUser = useCurrentUser();
  const [badge, setBadge] = useState<BadgeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccessOpen, setClaimSuccessOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !badgeId) return;

    const fetchBadgeDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE_URL}/badges/${badgeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch badge details');
        }

        const data = await response.json();
        setBadge(data);
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
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/badges/${badge.id}/download/png`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

  // UX-P0-004: Claim badge functionality
  const handleClaimBadge = async () => {
    if (!badge || badge.status !== BadgeStatus.PENDING) return;

    setClaiming(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/badges/${badge.id}/claim`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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
                />

                {/* AC 4.3: Issuer Message (conditional) */}
                {badge.issuerMessage && (
                  <IssuerMessage
                    issuerName={`${badge.issuer.firstName} ${badge.issuer.lastName}`}
                    message={badge.issuerMessage}
                  />
                )}

                {/* AC 4.4: Badge Info */}
                <BadgeInfo
                  description={badge.template.description}
                  skills={badge.template.skillIds}
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
                <VerificationSection assertionUrl={badge.assertionUrl} />

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
          <footer
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            {/* UX-P0-004: Claim Button for PENDING badges */}
            {badge?.status === BadgeStatus.PENDING && (
              <button
                onClick={handleClaimBadge}
                disabled={claiming}
                title={claiming ? 'Claiming...' : 'Claim this badge'}
                style={{
                  padding: '0.625rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'white',
                  backgroundColor: claiming ? '#9ca3af' : '#16a34a',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: claiming ? 'not-allowed' : 'pointer',
                  border: 'none',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!claiming) {
                    e.currentTarget.style.backgroundColor = '#15803d';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!claiming) {
                    e.currentTarget.style.backgroundColor = '#16a34a';
                  }
                }}
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
                      style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }}
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
              style={{
                padding: '0.625rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'white',
                backgroundColor:
                  badge?.status === BadgeStatus.REVOKED || badge?.status === BadgeStatus.PENDING
                    ? '#9ca3af'
                    : '#2563eb',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                cursor:
                  badge?.status === BadgeStatus.REVOKED || badge?.status === BadgeStatus.PENDING
                    ? 'not-allowed'
                    : 'pointer',
                border: 'none',
                opacity:
                  badge?.status === BadgeStatus.REVOKED || badge?.status === BadgeStatus.PENDING
                    ? 0.5
                    : 1,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (
                  badge?.status !== BadgeStatus.REVOKED &&
                  badge?.status !== BadgeStatus.PENDING
                ) {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                }
              }}
              onMouseLeave={(e) => {
                if (
                  badge?.status !== BadgeStatus.REVOKED &&
                  badge?.status !== BadgeStatus.PENDING
                ) {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }
              }}
            >
              <svg
                style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share Badge
            </button>
            {/* Story 9.3 AC3: Download button remains enabled for revoked badges (employees can keep records) */}
            <button
              onClick={handleDownloadBadge}
              disabled={downloading}
              title={downloading ? 'Downloading...' : 'Download badge as PNG'}
              style={{
                padding: '0.625rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                cursor: downloading ? 'not-allowed' : 'pointer',
                opacity: downloading ? 0.5 : 1,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!downloading) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (!downloading) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              {downloading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
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
          issuerMessage={badge.issuerMessage}
        />
      )}
    </>
  );
};

export default BadgeDetailModal;
