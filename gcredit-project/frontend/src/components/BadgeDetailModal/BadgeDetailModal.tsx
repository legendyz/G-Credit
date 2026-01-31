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

  console.log('BadgeDetailModal render - isOpen:', isOpen, 'badgeId:', badgeId);

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

  // Don't render anything if modal is closed
  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* AC 4.12: Desktop 800px width, centered */}
        {/* AC 4.13: Mobile full-screen */}
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: '100%',
            maxWidth: '48rem',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* AC 4.1: Header with close button */}
          <header style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 10
          }}>
            <h1 id="modal-title" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>
              Badge Details
            </h1>
            <button
              onClick={closeModal}
              style={{
                padding: '0.5rem',
                color: '#6b7280',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#374151'; e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: '1.5rem', height: '1.5rem' }}
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
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0' }}>
                <div style={{
                  animation: 'spin 1s linear infinite',
                  borderRadius: '9999px',
                  width: '3rem',
                  height: '3rem',
                  borderBottom: '2px solid #2563eb'
                }}></div>
              </div>
            )}

            {error && (
              <div style={{ padding: '1.5rem' }}>
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '1rem' }}>
                  <p style={{ color: '#b91c1c' }}>Error: {error}</p>
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
          <footer style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <button
              onClick={() => setShareModalOpen(true)}
              style={{
                padding: '0.625rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'white',
                backgroundColor: '#2563eb',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                border: 'none',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              <svg style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Badge
            </button>
            <button
              onClick={handleDownloadBadge}
              disabled={downloading}
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
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => !downloading && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => !downloading && (e.currentTarget.style.backgroundColor = 'white')}
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
