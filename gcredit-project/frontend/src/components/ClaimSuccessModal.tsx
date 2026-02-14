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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-success-title"
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '24rem',
          padding: '2rem',
          textAlign: 'center',
          animation: 'fadeInScale 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Checkmark */}
        <div
          style={{
            width: '5rem',
            height: '5rem',
            margin: '0 auto 1.5rem',
            backgroundColor: '#dcfce7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'bounceIn 0.5s ease-out',
          }}
        >
          <svg
            style={{
              width: '3rem',
              height: '3rem',
              color: '#16a34a',
            }}
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
              style={{
                strokeDasharray: 24,
                strokeDashoffset: 24,
                animation: 'drawCheck 0.4s ease-out 0.3s forwards',
              }}
            />
          </svg>
        </div>

        {/* Congratulations Message */}
        <h2
          id="claim-success-title"
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '0.5rem',
          }}
        >
          🎉 Congratulations!
        </h2>

        <p
          style={{
            fontSize: '1rem',
            color: '#4b5563',
            marginBottom: '1rem',
          }}
        >
          You've earned the <strong style={{ color: '#111827' }}>{badgeName}</strong> badge!
        </p>

        {/* Issuer Message (if provided) */}
        {issuerMessage && (
          <div
            style={{
              backgroundColor: '#f3f4f6',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <p
              style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                fontStyle: 'italic',
              }}
            >
              "{issuerMessage}"
            </p>
          </div>
        )}

        {/* Story 11.4: Visibility hint */}
        <p
          style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginBottom: '1rem',
          }}
        >
          Your badge is publicly visible. You can change this anytime from your wallet.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={handleViewInWallet}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: '#2563eb',
              color: 'white',
              fontWeight: 600,
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
          >
            View in Wallet
          </button>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              backgroundColor: 'transparent',
              color: '#6b7280',
              fontWeight: 500,
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            Continue Browsing
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes bounceIn {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default ClaimSuccessModal;
