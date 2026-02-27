/**
 * Badge Share Modal Component
 * Sprint 6 - Story 7.2, 7.3, 7.4: Share badge via Email, Widget, Teams
 * Sprint 8 - Story 8.3 (UX-P1-006): Tab keyboard navigation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  shareBadgeViaEmail,
  shareBadgeToTeams,
  recordLinkedInShare,
  recordWidgetCopy,
} from '../../lib/badgeShareApi';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface BadgeShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareSuccess?: () => void;
  badgeId: string;
  badgeName: string;
  verificationId?: string;
}

type ShareTab = 'email' | 'linkedin' | 'teams' | 'widget';

// Tab configuration — add/remove entries to control which tabs are shown
// TD-006: Teams tab excluded until Graph API permissions approved
const TAB_CONFIG: { id: ShareTab; label: React.ReactNode }[] = [
  { id: 'email', label: '📧 Email' },
  {
    id: 'linkedin',
    label: (
      <>
        <svg className="inline h-4 w-4 mr-1" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        LinkedIn
      </>
    ),
  },
  // { id: 'teams', label: '👥 Teams' },  // TD-006: Uncomment when Graph API ready
  { id: 'widget', label: '🔗 Widget' },
];

const TABS: ShareTab[] = TAB_CONFIG.map((t) => t.id);

const BadgeShareModal: React.FC<BadgeShareModalProps> = ({
  isOpen,
  onClose,
  onShareSuccess,
  badgeId,
  badgeName,
  verificationId,
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

  // LinkedIn sharing state
  const [linkedInMessage, setLinkedInMessage] = useState('');
  const [linkedInShared, setLinkedInShared] = useState(false);
  const [copiedLinkedIn, setCopiedLinkedIn] = useState(false);

  const verificationUrl = `${window.location.origin}/verify/${verificationId ?? badgeId}`;

  // LinkedIn default message
  useEffect(() => {
    if (activeTab === 'linkedin' && !linkedInMessage) {
      setLinkedInMessage(
        `I'm proud to have earned the ${badgeName} badge via G-Credit. ` +
          `This credential validates my professional skills. ` +
          `Verify my badge: ${verificationUrl} ` +
          `#DigitalCredentials #ProfessionalDevelopment #GCredit`
      );
    }
  }, [activeTab, badgeName, linkedInMessage, verificationUrl]);

  const handleLinkedInShare = async () => {
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}`;
    window.open(shareUrl, '_blank', 'width=600,height=600');

    // Record analytics (non-blocking)
    try {
      await recordLinkedInShare(badgeId);
    } catch {
      // Non-blocking — don't fail the share if analytics fails
    }

    setLinkedInShared(true);
    onShareSuccess?.();
    setTimeout(() => setLinkedInShared(false), 5000);
  };

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
      onShareSuccess?.();

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
      onShareSuccess?.();

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
    onShareSuccess?.();
    // Record widget copy analytics (non-blocking)
    recordWidgetCopy(badgeId).catch(() => {});
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
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              data-tab={tab.id}
              id={`share-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`share-panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
              className={`flex-1 min-h-[44px] px-3 py-2.5 text-sm font-medium transition-all
                         ${
                           activeTab === tab.id
                             ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                             : 'text-gray-600 hover:text-gray-900 active:bg-gray-100'
                         }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content - Tab Panels - Story 8.5: Responsive padding */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Status Messages - Live Region for Screen Readers */}
          <div role="status" aria-live="polite" aria-atomic="true">
            {/* Success Message */}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✅ {activeTab === 'widget' ? 'Link copied!' : 'Badge shared successfully!'}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div role="alert" className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Email Tab Panel */}
          {activeTab === 'email' && (
            <div
              role="tabpanel"
              id="share-panel-email"
              aria-labelledby="share-tab-email"
              className="flex flex-col gap-4"
            >
              <div>
                <label
                  htmlFor="share-email-recipients"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Recipient Emails *
                </label>
                <input
                  id="share-email-recipients"
                  type="text"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
                  disabled={loading}
                  aria-describedby="email-recipients-hint"
                />
                <p id="email-recipients-hint" className="mt-1 text-xs text-gray-500">
                  Separate multiple emails with commas
                </p>
              </div>

              <div>
                <label
                  htmlFor="share-email-message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Custom Message (Optional)
                </label>
                <textarea
                  id="share-email-message"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleShareViaEmail}
                disabled={loading || !emailRecipients.trim()}
                className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg border-none flex items-center justify-center transition-colors hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 w-5 h-5"
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
                    Sending...
                  </>
                ) : (
                  '📧 Send via Email'
                )}
              </button>
            </div>
          )}

          {/* LinkedIn Tab Panel */}
          {activeTab === 'linkedin' && (
            <div
              role="tabpanel"
              id="share-panel-linkedin"
              aria-labelledby="share-tab-linkedin"
              className="flex flex-col gap-4"
            >
              {/* Share Preview */}
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Share Preview</span>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm text-gray-700">
                  <p className="font-semibold mb-2">🏆 I earned the "{badgeName}" digital badge!</p>
                  <p className="text-gray-500 mb-2">
                    Issued via G-Credit. Verify:{' '}
                    <span className="text-blue-600 underline">{verificationUrl}</span>
                  </p>
                  <p className="text-gray-400 text-xs">
                    #DigitalCredentials #ProfessionalDevelopment #GCredit
                  </p>
                </div>
              </div>

              {/* Editable Message */}
              <div>
                <label
                  htmlFor="linkedin-message"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Your Message
                </label>
                <textarea
                  id="linkedin-message"
                  rows={3}
                  value={linkedInMessage}
                  onChange={(e) => setLinkedInMessage(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-3 text-sm"
                  placeholder="Add a personal message to your LinkedIn post..."
                />
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(linkedInMessage);
                      setCopiedLinkedIn(true);
                      setTimeout(() => setCopiedLinkedIn(false), 2000);
                    } catch {
                      // Fallback for older browsers
                      const textarea = document.createElement('textarea');
                      textarea.value = linkedInMessage;
                      document.body.appendChild(textarea);
                      textarea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textarea);
                      setCopiedLinkedIn(true);
                      setTimeout(() => setCopiedLinkedIn(false), 2000);
                    }
                  }}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 min-h-[36px] rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  aria-label="Copy message to clipboard"
                >
                  {copiedLinkedIn ? <>✓ Copied to clipboard</> : <>📋 Copy message first</>}
                </button>
              </div>

              {/* Share Button */}
              <button
                onClick={handleLinkedInShare}
                disabled={linkedInShared}
                className={`w-full flex items-center justify-center gap-2 min-h-[44px] rounded-lg text-sm font-medium border-none transition-colors ${
                  linkedInShared
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : 'bg-[#0A66C2] text-white cursor-pointer hover:bg-[#094F96]'
                }`}
              >
                {linkedInShared ? (
                  <>✓ LinkedIn opened — paste your message there</>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    Open LinkedIn to post
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                💡 Copy the message above, then paste it into the LinkedIn post editor
              </p>
            </div>
          )}

          {/* Teams Tab Panel */}
          {activeTab === 'teams' && (
            <div
              role="tabpanel"
              id="share-panel-teams"
              aria-labelledby="share-tab-teams"
              className="flex flex-col gap-4"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  💡 Leave Team ID and Channel ID empty to use default settings configured by your
                  administrator.
                </p>
              </div>

              <div>
                <label
                  htmlFor="share-teams-team-id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Team ID (Optional)
                </label>
                <input
                  id="share-teams-team-id"
                  type="text"
                  value={teamsTeamId}
                  onChange={(e) => setTeamsTeamId(e.target.value)}
                  placeholder="Leave empty for default team"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="share-teams-channel-id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Channel ID (Optional)
                </label>
                <input
                  id="share-teams-channel-id"
                  type="text"
                  value={teamsChannelId}
                  onChange={(e) => setTeamsChannelId(e.target.value)}
                  placeholder="Leave empty for default channel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="share-teams-message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Custom Message (Optional)
                </label>
                <textarea
                  id="share-teams-message"
                  value={teamsMessage}
                  onChange={(e) => setTeamsMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleShareToTeams}
                disabled={loading}
                className="w-full px-4 py-3 bg-violet-600 text-white font-medium rounded-lg border-none flex items-center justify-center transition-colors hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 w-5 h-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
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
              className="flex flex-col gap-4"
            >
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">🎨 Embeddable Badge Widget</h3>
                <p className="text-sm text-gray-700">
                  Generate an embeddable widget to display this badge on your website, portfolio, or
                  LinkedIn profile.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleOpenWidgetGenerator}
                  className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-medium rounded-lg border-none cursor-pointer flex items-center justify-center transition-all"
                >
                  <svg
                    className="w-5 h-5 mr-2"
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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <button
                  onClick={handleCopyWidgetLink}
                  className="w-full px-4 py-3 border-2 border-gray-300 bg-white text-gray-700 font-medium rounded-lg cursor-pointer flex items-center justify-center transition-colors hover:bg-gray-100"
                >
                  <svg
                    className="w-5 h-5 mr-2"
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

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                <p className="text-xs text-gray-600">
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
