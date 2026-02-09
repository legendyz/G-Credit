/**
 * Badge Widget Embed Page
 * Sprint 6 - Story 7.3: Generate embeddable badge widget code
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getWidgetEmbedData, getWidgetHtml } from '../lib/badgeShareApi';
import type { WidgetEmbedData, WidgetHtmlData } from '../lib/badgeShareApi';

type WidgetSize = 'small' | 'medium' | 'large';
type WidgetTheme = 'light' | 'dark' | 'auto';

const BadgeEmbedPage: React.FC = () => {
  const { badgeId } = useParams<{ badgeId: string }>();
  const [badge, setBadge] = useState<WidgetEmbedData | null>(null);
  const [widgetHtml, setWidgetHtml] = useState<WidgetHtmlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Widget configuration
  const [size, setSize] = useState<WidgetSize>('medium');
  const [theme, setTheme] = useState<WidgetTheme>('light');
  const [showDetails, setShowDetails] = useState(true);

  // Copy feedback
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!badgeId) return;

    const fetchBadgeData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getWidgetEmbedData(badgeId);
        setBadge(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load badge data');
      } finally {
        setLoading(false);
      }
    };

    fetchBadgeData();
  }, [badgeId]);

  useEffect(() => {
    if (!badgeId) return;

    const fetchWidgetHtml = async () => {
      try {
        const data = await getWidgetHtml(badgeId, { size, theme, showDetails });
        setWidgetHtml(data);
      } catch {
        toast.error('Failed to load badge widget');
      }
    };

    fetchWidgetHtml();
  }, [badgeId, size, theme, showDetails]);

  const generateIframeCode = () => {
    if (!badgeId) return '';

    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      size,
      theme,
      showDetails: String(showDetails),
    });

    return `<iframe
  src="${baseUrl}/api/badges/${badgeId}/widget?${params}"
  width="${size === 'small' ? '100' : size === 'medium' ? '200' : '300'}"
  height="${size === 'small' ? '100' : size === 'medium' ? '200' : '300'}"
  frameborder="0"
  style="border: none;"
></iframe>`;
  };

  const generateStandaloneCode = () => {
    if (!widgetHtml) return '';

    return `<!-- G-Credit Badge Widget -->
<div id="badge-widget-${badgeId}"></div>

<style>
${widgetHtml.css}
</style>

<script>
(function() {
  const container = document.getElementById('badge-widget-${badgeId}');
  container.innerHTML = \`${widgetHtml.html.replace(/`/g, '\\`')}\`;
  
  ${widgetHtml.script}
})();
</script>`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading badge data...</p>
        </div>
      </div>
    );
  }

  if (error || !badge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-700">{error || 'Badge not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎨 Badge Widget Generator</h1>
          <p className="text-lg text-gray-600">
            Create an embeddable widget for <strong>{badge.badgeName}</strong>
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Configuration */}
          <div className="space-y-6">
            {/* Widget Preview */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Preview</h2>
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
                {widgetHtml && <div dangerouslySetInnerHTML={{ __html: widgetHtml.html }} />}
              </div>
            </div>

            {/* Configuration Options */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Configuration</h2>

              <div className="space-y-4">
                {/* Size */}
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Widget Size</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['small', 'medium', 'large'] as WidgetSize[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                          size === s
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                        <div className="text-xs text-gray-500 mt-1">
                          {s === 'small' && '100x100'}
                          {s === 'medium' && '200x200'}
                          {s === 'large' && '300x300'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Color Theme</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['light', 'dark', 'auto'] as WidgetTheme[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                          theme === t
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Show Details */}
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDetails}
                      onChange={(e) => setShowDetails(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Show badge name and issuer details
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Code */}
          <div className="space-y-6">
            {/* Iframe Embed */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Iframe Embed</h2>
                <button
                  onClick={() => handleCopy(generateIframeCode())}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                >
                  {copied ? '✓ Copied!' : '📋 Copy Code'}
                </button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{generateIframeCode()}</code>
              </pre>
              <p className="text-xs text-gray-500 mt-2">Best for embedding in existing websites</p>
            </div>

            {/* Standalone HTML */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Standalone HTML</h2>
                <button
                  onClick={() => handleCopy(generateStandaloneCode())}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                >
                  {copied ? '✓ Copied!' : '📋 Copy Code'}
                </button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
                <code>{generateStandaloneCode()}</code>
              </pre>
              <p className="text-xs text-gray-500 mt-2">
                Complete HTML/CSS/JS for direct embedding
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">📖 How to Use</h3>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Choose your preferred widget size, theme, and options</li>
                <li>Copy the embed code (iframe or standalone)</li>
                <li>Paste the code into your website, portfolio, or profile</li>
                <li>The widget will automatically display your badge</li>
                <li>Clicking the widget opens the verification page</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => window.close()}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
          >
            ← Close Window
          </button>
        </div>
      </div>

      {/* Inject widget CSS */}
      {widgetHtml && <style dangerouslySetInnerHTML={{ __html: widgetHtml.css }} />}
    </div>
  );
};

export default BadgeEmbedPage;
