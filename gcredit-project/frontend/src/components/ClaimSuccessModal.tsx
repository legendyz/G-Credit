/**
 * Claim Success Modal - Story 0.2a / UX-P0-004
 *
 * Celebration modal shown after successfully claiming a badge.
 * Features: animated checkmark, congratulations message, "View in Wallet" button.
 */

import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

interface ClaimSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  badgeName: string;
  issuerMessage?: string | null;
}

export function ClaimSuccessModal({
  isOpen,
  onClose,
  badgeName,
  issuerMessage,
}: ClaimSuccessModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  const handleViewInWallet = () => {
    onClose();
    queryClient.invalidateQueries({ queryKey: ['wallet'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    navigate('/wallet');
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[10001] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-success-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-[fadeInScale_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Checkmark */}
        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center animate-[bounceIn_0.5s_ease-out]">
          <svg
            className="w-12 h-12 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
              /* Inline style retained: strokeDasharray/offset are SVG-specific computed values */
              style={{
                strokeDasharray: 24,
                strokeDashoffset: 24,
              }}
              className="animate-[drawCheck_0.4s_ease-out_0.3s_forwards]"
            />
          </svg>
        </div>

        {/* Congratulations Message */}
        <h2 id="claim-success-title" className="text-2xl font-bold text-gray-900 mb-2">
          🎉 Congratulations!
        </h2>

        <p className="text-base text-gray-600 mb-4">
          You've earned the <strong className="text-gray-900">{badgeName}</strong> badge!
        </p>

        {/* Issuer Message (if provided) */}
        {issuerMessage && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 italic">"{issuerMessage}"</p>
          </div>
        )}

        {/* Story 11.4: Visibility hint */}
        <p className="text-sm text-gray-500 mb-4">
          Your badge is publicly visible. You can change this anytime from your wallet.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleViewInWallet}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg border-none cursor-pointer text-sm transition-colors hover:bg-blue-700"
          >
            View in Wallet
          </button>

          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-transparent text-gray-500 font-medium rounded-lg border border-gray-200 cursor-pointer text-sm transition-all hover:bg-gray-50 hover:border-gray-300"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClaimSuccessModal;
