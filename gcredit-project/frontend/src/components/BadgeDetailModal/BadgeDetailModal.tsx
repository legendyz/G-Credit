import React, { useEffect, useState } from 'react';
import { useBadgeDetailModal } from '../../stores/badgeDetailModal';
import type { BadgeDetail } from '../../types/badge';
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

const BadgeDetailModal: React.FC = () => {
  const { isOpen, badgeId, closeModal } = useBadgeDetailModal();
  const [badge, setBadge] = useState<BadgeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (isOpen && badgeId) {
      fetchBadgeDetails();
    }
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

  const fetchBadgeDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:3000/api/badges/${badgeId}`, {
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

  // Sprint 6: Download badge as PNG (Story 6.4 - Baked Badge)
  const handleDownloadBadge = async () => {
    if (!badge) return;

    setDownloading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:3000/api/badges/${badge.id}/download/png`, {
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
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download badge. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // AC 4.15: Click backdrop closes modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* AC 4.12: Overlay backdrop with rgba(0,0,0,0.5) */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* AC 4.12: Desktop 800px width, centered */}
        {/* AC 4.13: Mobile full-screen */}
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col md:animate-fadeIn">
          {/* AC 4.1: Header with close button */}
          <header className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
            <h1 id="modal-title" className="text-xl font-bold text-gray-900">
              Badge Details
            </h1>
            <button
              onClick={closeModal}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {error && (
              <div className="p-6">
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

                {/* AC 4.5: Timeline Section */}
                <TimelineSection
                  issuedAt={badge.issuedAt}
                  claimedAt={badge.claimedAt}
                  expiresAt={badge.expiresAt}
                />

                {/* AC 4.6: Verification Section */}
                <VerificationSection
                  assertionUrl={badge.assertionUrl}
                />

                {/* Sprint 6: Badge Share Analytics (Story 7.5) */}
                <BadgeAnalytics
                  badgeId={badge.id}
                  isOwner={true} // TODO: Check if current user is badge owner or issuer
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
                    console.log('Report submitted successfully');
                  }}
                />
              </>
            )}
          </div>

          {/* AC 4.8: Action Footer (Share/Download buttons - future enhancement) */}
          <footer className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
            <button
              onClick={() => setShareModalOpen(true)}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Badge
            </button>
            <button
              onClick={handleDownloadBadge}
              disabled={downloading}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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
    </>
  );
};

export default BadgeDetailModal;
