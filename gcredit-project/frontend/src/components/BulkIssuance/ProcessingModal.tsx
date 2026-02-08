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
 * - Estimated remaining time
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
  
  useEffect(() => {
    if (!isProcessing) {
      setProgress(0);
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
    
    return () => clearInterval(interval);
  }, [isProcessing]);
  
  if (!isProcessing) return null;
  
  const percentComplete = Math.round(progress);
  const estimatedRemaining = Math.max(1, Math.ceil(totalBadges * (1 - progress / 100)));
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-bold mb-6 text-gray-800">
          ⏳ 正在发放徽章...
        </h2>
        
        {/* Progress Bar Section */}
        <div className="mb-6">
          <div className="flex justify-between mb-2 text-sm text-gray-600">
            <span className="font-medium">{percentComplete}%</span>
            <span>Processing {totalBadges} badges</span>
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
            ⏱️ 预计剩余时间: 
            <span className="font-semibold text-gray-800 ml-1">
              {estimatedRemaining > 60 ? `${Math.ceil(estimatedRemaining / 60)} 分钟` : `${estimatedRemaining} 秒`}
            </span>
          </p>
        </div>
        
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
                请勿刷新页面或关闭浏览器
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                批量发放正在进行中，关闭页面可能导致发放中断
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
