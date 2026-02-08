import { useState, useEffect } from 'react';

interface ProcessingModalProps {
  totalBadges: number;
  isProcessing: boolean;
}

/**
 * Processing Modal Component (UX-P0-1)
 * 
 * Displays pseudo-progress during bulk badge issuance:
 * - Visual progress bar (fills gradually to ~90%, waits for completion)
 * - Estimated remaining time based on ~1 badge/second
 * - Warning to prevent page close
 *
 * NOTE: This is a visual indicator only. Real results come from the
 * backend API call in BulkPreviewPage.
 */
export default function ProcessingModal({ 
  totalBadges, 
  isProcessing,
}: ProcessingModalProps) {
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  useEffect(() => {
    if (!isProcessing) {
      setProgress(0);
      setElapsedSeconds(0);
      return;
    }
    
    // Pseudo-progress: ramp quickly to 30%, slow to 60%, very slow to 90%
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev; // cap at 90% until real completion
        if (prev < 30) return prev + 3;
        if (prev < 60) return prev + 2;
        return prev + 0.5;
      });
    }, 500);

    // Track elapsed time
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [isProcessing]);
  
  if (!isProcessing) return null;
  
  const percentComplete = Math.round(progress);
  const estimatedTotal = Math.max(totalBadges, 1);
  const estimatedRemaining = Math.max(0, estimatedTotal - elapsedSeconds);
  const estimatedCurrent = Math.min(elapsedSeconds, totalBadges);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-bold mb-6 text-gray-800">
          ⏳ Issuing Badges...
        </h2>
        
        {/* Progress Bar Section */}
        <div className="mb-6">
          <div className="flex justify-between mb-2 text-sm text-gray-600">
            <span className="font-medium">{percentComplete}%</span>
            <span>Processing ~{estimatedCurrent}/{totalBadges} badges</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${percentComplete}%` }} 
            />
          </div>
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
