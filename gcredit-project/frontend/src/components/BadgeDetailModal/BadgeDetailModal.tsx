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

const BadgeDetailModal: React.FC = () => {
  const { isOpen, badgeId, closeModal } = useBadgeDetailModal();
  const [badge, setBadge] = useState<BadgeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const token = localStorage.getItem('access_token');
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
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded transition-colors">
              📤 Share
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded transition-colors">
              ⬇️ Download
            </button>
          </footer>
        </div>
      </div>
    </>
  );
};

export default BadgeDetailModal;
