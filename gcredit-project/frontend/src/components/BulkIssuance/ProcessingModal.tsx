import { useState, useEffect } from 'react';

interface BadgePreviewRow {
  badgeName?: string;
  recipientName?: string;
  recipientEmail?: string;
}

interface ProcessingModalProps {
  totalBadges: number;
  isProcessing: boolean;
  /** Optional preview rows for simulated "currently processing" display */
  badgeRows?: BadgePreviewRow[];
}

/**
 * Processing Modal Component (UX-P0-1)
 * 
 * Displays pseudo-progress during bulk badge issuance:
 * - Visual progress bar with 1-second tick per badge
 * - Current badge being processed
 * - Running success/failure count estimates
 * - Estimated remaining time based on ~1 badge/second
 * - Warning to prevent page close
 *
 * NOTE: Progress is simulated (1 badge/second assumption).
 * Real results come from the backend API call in BulkPreviewPage.
 */
export default function ProcessingModal({ 
  totalBadges, 
  isProcessing,
  badgeRows,
}: ProcessingModalProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  useEffect(() => {
    if (!isProcessing) {
      setElapsedSeconds(0);
      return;
    }

    // Track elapsed time — 1-second ticks (1 badge/second assumption)
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, [isProcessing]);
  
  if (!isProcessing) return null;
  
  // Simulated progress: 1 badge per second tick, cap at 90% of total
  const estimatedCurrent = Math.min(elapsedSeconds, totalBadges);
  const tickProgress = totalBadges > 0
    ? Math.min(90, Math.round((estimatedCurrent / totalBadges) * 100))
    : 0;
  const percentComplete = tickProgress;
  const estimatedRemaining = Math.max(0, totalBadges - elapsedSeconds);

  // Simulated running counts (assume all succeed until real results arrive)
  const simulatedSuccess = estimatedCurrent;
  const simulatedRemaining = Math.max(0, totalBadges - estimatedCurrent);

  // Current badge being processed (simulated)
  const currentIdx = Math.min(elapsedSeconds, totalBadges - 1);
  const currentBadge = badgeRows?.[currentIdx];
  const currentBadgeLabel = currentBadge
    ? `${currentBadge.badgeName ?? 'Badge'} → ${currentBadge.recipientName ?? currentBadge.recipientEmail ?? 'Recipient'}`
    : null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-bold mb-6 text-gray-800">
          ⏳ Issuing Badges...
        </h2>
        
        {/* Progress Bar Section */}
        <div className="mb-4">
          <div className="flex justify-between mb-2 text-sm text-gray-600">
            <span className="font-medium">{percentComplete}% ({estimatedCurrent}/{totalBadges})</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${percentComplete}%` }} 
            />
          </div>
        </div>

        {/* Currently processing badge */}
        {currentBadgeLabel && estimatedCurrent < totalBadges && (
          <div className="mb-4 text-sm text-gray-700">
            <span className="text-green-600">✅</span> Processing: {currentBadgeLabel}
          </div>
        )}

        {/* Running success/failure/remaining counts */}
        <div className="flex justify-center gap-6 mb-4 text-sm">
          <span className="text-green-600 font-medium">✓ {simulatedSuccess} done</span>
          <span className="text-gray-500">⏳ {simulatedRemaining} remaining</span>
        </div>
        
        {/* Estimated Time */}
        <div className="text-center mb-6">
          <p className="text-gray-600">
            ⏱️ Estimated time remaining:{' '}
            <span className="font-semibold text-gray-800 ml-1">
              {estimatedRemaining > 60 ? `${Math.ceil(estimatedRemaining / 60)} minutes` : `${estimatedRemaining} seconds`}
            </span>
          </p>
        </div>

        {/* Timeout Warning */}
        {elapsedSeconds >= 25 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg mb-4">
            <p className="text-sm text-orange-800">
              Processing is taking longer than expected. Please wait...
            </p>
          </div>
        )}
        
        {/* Processing Animation */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
        
        {/* Warning Message */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <div>
              <p className="text-sm text-yellow-800 font-medium">
                Please do not refresh or close your browser
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Bulk issuance is in progress. Closing this page may interrupt the process.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
