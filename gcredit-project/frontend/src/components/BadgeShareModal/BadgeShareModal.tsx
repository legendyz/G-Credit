/**
 * Badge Share Modal Component
 * Sprint 6 - Story 7.2, 7.3, 7.4: Share badge via Email, Widget, Teams
 * Sprint 8 - Story 8.3 (UX-P1-006): Tab keyboard navigation
 */

import React, { useState, useCallback } from 'react';
import { shareBadgeViaEmail, shareBadgeToTeams } from '../../lib/badgeShareApi';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface BadgeShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  badgeId: string;
  badgeName: string;
}

type ShareTab = 'email' | 'teams' | 'widget';

const TABS: ShareTab[] = ['email', 'teams', 'widget'];

const BadgeShareModal: React.FC<BadgeShareModalProps> = ({
  isOpen,
  onClose,
  badgeId,
  badgeName,
}) => {
  const [activeTab, setActiveTab] = useState<ShareTab>('email');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Story 8.3: Focus trap for modal (AC1)
  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onClose,
  });

  // Story 8.3 (UX-P1-006): Tab keyboard navigation
  const handleTabKeyDown = useCallback((e: React.KeyboardEvent, currentTab: ShareTab) => {
    const currentIndex = TABS.indexOf(currentTab);
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = currentIndex === 0 ? TABS.length - 1 : currentIndex - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        newIndex = currentIndex === TABS.length - 1 ? 0 : currentIndex + 1;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = TABS.length - 1;
        break;
      default:
        return;
    }

    setActiveTab(TABS[newIndex]);
    // Focus the new tab button
    const tabButton = document.querySelector(`[data-tab="${TABS[newIndex]}"]`) as HTMLElement;
    tabButton?.focus();
  }, []);

  // Email sharing state
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  // Teams sharing state
  const [teamsTeamId, setTeamsTeamId] = useState('');
  const [teamsChannelId, setTeamsChannelId] = useState('');
  const [teamsMessage, setTeamsMessage] = useState('');

  const handleShareViaEmail = async () => {
    if (!emailRecipients.trim()) {
      setError('Please enter at least one email address');
      return;
    }

    const emails = emailRecipients
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emails.length === 0) {
      setError('Please enter valid email addresses');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await shareBadgeViaEmail(badgeId, {
        recipientEmails: emails,
        customMessage: emailMessage || undefined,
      });

      setSuccess(true);
      setEmailRecipients('');
      setEmailMessage('');

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share badge');
    } finally {
      setLoading(false);
    }
  };

  const handleShareToTeams = async () => {
    setLoading(true);
    setError(null);

    try {
      await shareBadgeToTeams(badgeId, {
        teamId: teamsTeamId || undefined,
        channelId: teamsChannelId || undefined,
        customMessage: teamsMessage || undefined,
      });

      setSuccess(true);
      setTeamsTeamId('');
      setTeamsChannelId('');
      setTeamsMessage('');

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share to Teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyWidgetLink = () => {
    const widgetUrl = `${window.location.origin}/badges/${badgeId}/embed`;
    navigator.clipboard.writeText(widgetUrl);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleOpenWidgetGenerator = () => {
    window.open(`/badges/${badgeId}/embed`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-0 md:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      {/* Story 8.5: Responsive modal - full screen on mobile, max-width 32rem on tablet/desktop */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        className="bg-white md:rounded-lg shadow-2xl
                   w-full h-full md:h-auto md:max-h-[80vh] md:max-w-lg
                   overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Story 8.5: Touch-friendly close button (44×44px) */}
        <header className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 id="share-modal-title" className="text-lg md:text-xl font-bold text-gray-900">
              Share Badge
            </h2>
            <p className="text-sm text-gray-600 mt-0.5 truncate max-w-[200px] md:max-w-none">
              {badgeName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-11 h-11 -mr-2
                       text-gray-500 hover:text-gray-700 hover:bg-white/70
                       active:bg-white rounded-full transition-all"
            aria-label="Close share modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
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

        {/* Tabs - Story 8.3 UX-P1-006: Keyboard navigation, Story 8.5: Touch-friendly height */}
        <div
          role="tablist"
          aria-label="Share options"
          className="flex border-b border-gray-200 bg-gray-50"
        >
          <button
            role="tab"
            data-tab="email"
            id="share-tab-email"
            aria-selected={activeTab === 'email'}
            aria-controls="share-panel-email"
            tabIndex={activeTab === 'email' ? 0 : -1}
            onClick={() => setActiveTab('email')}
            onKeyDown={(e) => handleTabKeyDown(e, 'email')}
            className={`flex-1 min-h-[44px] px-3 py-2.5 text-sm font-medium transition-all
                       ${
                         activeTab === 'email'
                           ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                           : 'text-gray-600 hover:text-gray-900 active:bg-gray-100'
                       }`}
          >
            📧 Email
          </button>
          <button
            role="tab"
            data-tab="teams"
            id="share-tab-teams"
            aria-selected={activeTab === 'teams'}
            aria-controls="share-panel-teams"
            tabIndex={activeTab === 'teams' ? 0 : -1}
            onClick={() => setActiveTab('teams')}
            onKeyDown={(e) => handleTabKeyDown(e, 'teams')}
            className={`flex-1 min-h-[44px] px-3 py-2.5 text-sm font-medium transition-all
                       ${
                         activeTab === 'teams'
                           ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                           : 'text-gray-600 hover:text-gray-900 active:bg-gray-100'
                       }`}
          >
            👥 Teams
          </button>
          <button
            role="tab"
            data-tab="widget"
            id="share-tab-widget"
            aria-selected={activeTab === 'widget'}
            aria-controls="share-panel-widget"
            tabIndex={activeTab === 'widget' ? 0 : -1}
            onClick={() => setActiveTab('widget')}
            onKeyDown={(e) => handleTabKeyDown(e, 'widget')}
            className={`flex-1 min-h-[44px] px-3 py-2.5 text-sm font-medium transition-all
                       ${
                         activeTab === 'widget'
                           ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                           : 'text-gray-600 hover:text-gray-900 active:bg-gray-100'
                       }`}
          >
            🔗 Widget
          </button>
        </div>

        {/* Content - Tab Panels - Story 8.5: Responsive padding */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Status Messages - Live Region for Screen Readers */}
          <div role="status" aria-live="polite" aria-atomic="true">
            {/* Success Message */}
            {success && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '0.5rem',
                }}
              >
                <p style={{ color: '#166534', fontWeight: 500 }}>
                  ✅ {activeTab === 'widget' ? 'Link copied!' : 'Badge shared successfully!'}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                style={{
                  marginBottom: '1rem',
                  padding: '1rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                }}
              >
                <p style={{ color: '#991b1b' }}>{error}</p>
              </div>
            )}
          </div>

          {/* Email Tab Panel */}
          {activeTab === 'email' && (
            <div
              role="tabpanel"
              id="share-panel-email"
              aria-labelledby="share-tab-email"
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div>
                <label
                  htmlFor="share-email-recipients"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem',
                  }}
                >
                  Recipient Emails *
                </label>
                <input
                  id="share-email-recipients"
                  type="text"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                  disabled={loading}
                  aria-describedby="email-recipients-hint"
                />
                <p
                  id="email-recipients-hint"
                  style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}
                >
                  Separate multiple emails with commas
                </p>
              </div>

              <div>
                <label
                  htmlFor="share-email-message"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem',
                  }}
                >
                  Custom Message (Optional)
                </label>
                <textarea
                  id="share-email-message"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    resize: 'none',
                    outline: 'none',
                  }}
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleShareViaEmail}
                disabled={loading || !emailRecipients.trim()}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: loading || !emailRecipients.trim() ? '#d1d5db' : '#2563eb',
                  color: 'white',
                  fontWeight: 500,
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: loading || !emailRecipients.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) =>
                  !loading &&
                  emailRecipients.trim() &&
                  (e.currentTarget.style.backgroundColor = '#1d4ed8')
                }
                onMouseLeave={(e) =>
                  !loading &&
                  emailRecipients.trim() &&
                  (e.currentTarget.style.backgroundColor = '#2563eb')
                }
              >
                {loading ? (
                  <>
                    <svg
                      style={{
                        animation: 'spin 1s linear infinite',
                        marginLeft: '-0.25rem',
                        marginRight: '0.75rem',
                        width: '1.25rem',
                        height: '1.25rem',
                      }}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        style={{ opacity: 0.25 }}
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        style={{ opacity: 0.75 }}
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  '📧 Send via Email'
                )}
              </button>
            </div>
          )}

          {/* Teams Tab Panel */}
          {activeTab === 'teams' && (
            <div
              role="tabpanel"
              id="share-panel-teams"
              aria-labelledby="share-tab-teams"
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div
                style={{
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <p style={{ fontSize: '0.875rem', color: '#1e40af' }}>
                  💡 Leave Team ID and Channel ID empty to use default settings configured by your
                  administrator.
                </p>
              </div>

              <div>
                <label
                  htmlFor="share-teams-team-id"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem',
                  }}
                >
                  Team ID (Optional)
                </label>
                <input
                  id="share-teams-team-id"
                  type="text"
                  value={teamsTeamId}
                  onChange={(e) => setTeamsTeamId(e.target.value)}
                  placeholder="Leave empty for default team"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="share-teams-channel-id"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem',
                  }}
                >
                  Channel ID (Optional)
                </label>
                <input
                  id="share-teams-channel-id"
                  type="text"
                  value={teamsChannelId}
                  onChange={(e) => setTeamsChannelId(e.target.value)}
                  placeholder="Leave empty for default channel"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="share-teams-message"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem',
                  }}
                >
                  Custom Message (Optional)
                </label>
                <textarea
                  id="share-teams-message"
                  value={teamsMessage}
                  onChange={(e) => setTeamsMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    resize: 'none',
                    outline: 'none',
                  }}
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleShareToTeams}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: loading ? '#d1d5db' : '#7c3aed',
                  color: 'white',
                  fontWeight: 500,
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) =>
                  !loading && (e.currentTarget.style.backgroundColor = '#6d28d9')
                }
                onMouseLeave={(e) =>
                  !loading && (e.currentTarget.style.backgroundColor = '#7c3aed')
                }
              >
                {loading ? (
                  <>
                    <svg
                      style={{
                        animation: 'spin 1s linear infinite',
                        marginLeft: '-0.25rem',
                        marginRight: '0.75rem',
                        width: '1.25rem',
                        height: '1.25rem',
                      }}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        style={{ opacity: 0.25 }}
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        style={{ opacity: 0.75 }}
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sharing...
                  </>
                ) : (
                  '👥 Share to Teams'
                )}
              </button>
            </div>
          )}

          {/* Widget Tab Panel */}
          {activeTab === 'widget' && (
            <div
              role="tabpanel"
              id="share-panel-widget"
              aria-labelledby="share-tab-widget"
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div
                style={{
                  background: 'linear-gradient(to right, #f0fdf4, #eff6ff)',
                  border: '1px solid #bbf7d0',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                }}
              >
                <h3 style={{ fontWeight: 500, color: '#111827', marginBottom: '0.5rem' }}>
                  🎨 Embeddable Badge Widget
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#374151' }}>
                  Generate an embeddable widget to display this badge on your website, portfolio, or
                  LinkedIn profile.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={handleOpenWidgetGenerator}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'linear-gradient(to right, #10b981, #3b82f6)',
                    color: 'white',
                    fontWeight: 500,
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <svg
                    style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                  Open Widget Generator
                </button>

                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    aria-hidden="true"
                  >
                    <div style={{ width: '100%', borderTop: '1px solid #d1d5db' }}></div>
                  </div>
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                    }}
                  >
                    <span
                      style={{ padding: '0 0.5rem', backgroundColor: 'white', color: '#6b7280' }}
                    >
                      or
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCopyWidgetLink}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #d1d5db',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontWeight: 500,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                >
                  <svg
                    style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy Widget Link
                </button>
              </div>

              <div
                style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginTop: '1rem',
                }}
              >
                <p style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                  <strong>Widget Features:</strong>
                  <br />
                  • 3 sizes (small, medium, large)
                  <br />
                  • 3 themes (light, dark, auto)
                  <br />
                  • Responsive design
                  <br />• Click-to-verify functionality
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BadgeShareModal;
