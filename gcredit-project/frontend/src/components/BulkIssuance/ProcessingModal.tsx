import React, { useState, useEffect } from 'react';

interface ProcessingModalProps {
  totalBadges: number;
  isProcessing: boolean;
  onComplete?: (results: { success: number; failed: number }) => void;
}

/**
 * Processing Modal Component (UX-P0-1)
 * 
 * Displays real-time progress during bulk badge issuance:
 * - Visual progress bar
 * - Live success/failure counters
 * - Estimated remaining time
 * - Warning to prevent page close
 */
export default function ProcessingModal({ 
  totalBadges, 
  isProcessing,
  onComplete 
}: ProcessingModalProps) {
  const [progress, setProgress] = useState({ current: 0, success: 0, failed: 0 });
  
  useEffect(() => {
    if (!isProcessing) {
      setProgress({ current: 0, success: 0, failed: 0 });
      return;
    }
    
    // Simulate progress (in real implementation, this would be from SSE or polling)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev.current >= totalBadges) {
          clearInterval(interval);
          if (onComplete) {
            onComplete({ success: prev.success, failed: prev.failed });
          }
          return prev;
        }
        
        const newCurrent = prev.current + 1;
        // 90% success rate simulation (real data would come from backend)
        const isSuccess = Math.random() > 0.1;
        const newSuccess = prev.success + (isSuccess ? 1 : 0);
        const newFailed = prev.failed + (isSuccess ? 0 : 1);
        
        return {
          current: newCurrent,
          success: newSuccess,
          failed: newFailed
        };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isProcessing, totalBadges, onComplete]);
  
  if (!isProcessing) return null;
  
  const percentComplete = totalBadges > 0 
    ? Math.round((progress.current / totalBadges) * 100) 
    : 0;
  const remaining = totalBadges - progress.current;
  
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
            <span>{progress.current} / {totalBadges}</span>
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
              {remaining > 60 ? `${Math.ceil(remaining / 60)} 分钟` : `${remaining} 秒`}
            </span>
          </p>
        </div>
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-3 gap-4 text-center mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-green-600 font-bold text-2xl">{progress.success}</p>
            <p className="text-green-700 text-sm">已完成 ✓</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-red-600 font-bold text-2xl">{progress.failed}</p>
            <p className="text-red-700 text-sm">失败 ✗</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-600 font-bold text-2xl">{remaining}</p>
            <p className="text-gray-700 text-sm">剩余</p>
          </div>
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
