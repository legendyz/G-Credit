import React, { useState } from 'react';

interface VerificationSectionProps {
  assertionUrl: string;
}

const VerificationSection: React.FC<VerificationSectionProps> = ({ assertionUrl }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(assertionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleVerify = () => {
    // AC 4.6: Open verification URL in new tab
    window.open(assertionUrl, '_blank');
  };

  return (
    <section className="px-6 py-6 border-b">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification</h3>

      {/* AC 4.6: Public verification URL */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-600 mb-2">Public Verification URL</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={assertionUrl}
            readOnly
            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {/* AC 4.6: Copy button */}
          <button
            onClick={handleCopyUrl}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
            aria-label="Copy verification URL"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* AC 4.6: Verify on G-Credit link */}
      <button
        onClick={handleVerify}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
      >
        🔍 Verify on G-Credit
      </button>

      {/* AC 4.6: QR code (future enhancement placeholder) */}
      <p className="text-xs text-gray-500 text-center mt-4">QR code verification coming soon</p>
    </section>
  );
};

export default VerificationSection;
