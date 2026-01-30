/**
 * Badge Share Modal Component
 * Sprint 6 - Story 7.2, 7.3, 7.4: Share badge via Email, Widget, Teams
 */

import React, { useState } from 'react';
import { shareBadgeViaEmail, shareBadgeToTeams } from '../../lib/badgeShareApi';

interface BadgeShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  badgeId: string;
  badgeName: string;
}

type ShareTab = 'email' | 'teams' | 'widget';

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
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <header className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Share Badge</h2>
            <p className="text-sm text-gray-600 mt-1">{badgeName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-full transition-colors"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'email'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            📧 Email
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'teams'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            👥 Teams
          </button>
          <button
            onClick={() => setActiveTab('widget')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'widget'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            🔗 Widget
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium">✅ {activeTab === 'widget' ? 'Link copied!' : 'Badge shared successfully!'}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Emails *
                </label>
                <input
                  type="text"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500">Separate multiple emails with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Message (Optional)
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleShareViaEmail}
                disabled={loading || !emailRecipients.trim()}
                className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  '📧 Send via Email'
                )}
              </button>
            </div>
          )}

          {/* Teams Tab */}
          {activeTab === 'teams' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  💡 Leave Team ID and Channel ID empty to use default settings configured by your administrator.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team ID (Optional)
                </label>
                <input
                  type="text"
                  value={teamsTeamId}
                  onChange={(e) => setTeamsTeamId(e.target.value)}
                  placeholder="Leave empty for default team"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel ID (Optional)
                </label>
                <input
                  type="text"
                  value={teamsChannelId}
                  onChange={(e) => setTeamsChannelId(e.target.value)}
                  placeholder="Leave empty for default channel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Message (Optional)
                </label>
                <textarea
                  value={teamsMessage}
                  onChange={(e) => setTeamsMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleShareToTeams}
                disabled={loading}
                className="w-full px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sharing...
                  </>
                ) : (
                  '👥 Share to Teams'
                )}
              </button>
            </div>
          )}

          {/* Widget Tab */}
          {activeTab === 'widget' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">🎨 Embeddable Badge Widget</h3>
                <p className="text-sm text-gray-700">
                  Generate an embeddable widget to display this badge on your website, portfolio, or LinkedIn profile.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleOpenWidgetGenerator}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-blue-600 transition-all flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Open Widget Generator
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <button
                  onClick={handleCopyWidgetLink}
                  className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
                  <br />
                  • Click-to-verify functionality
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
