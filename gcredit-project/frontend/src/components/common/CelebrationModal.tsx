/**
 * CelebrationModal Component - Story 8.1 (UX-P1-001)
 *
 * Animated celebration modal for milestone achievements and badge claims.
 * Provides positive feedback with confetti effects and animations.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export interface CelebrationModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Achievement icon (emoji or component) */
  icon?: React.ReactNode;
  /** Badge image URL */
  badgeImageUrl?: string;
  /** Achievement name */
  achievementName?: string;
  /** Call to action text */
  ctaText?: string;
  /** Call to action handler */
  onCtaClick?: () => void;
  /** Type of celebration for styling */
  type?: 'badge' | 'milestone' | 'achievement';
}

// Confetti particle component (position passed as prop to avoid impure Math.random during render)
const ConfettiParticle: React.FC<{ delay: number; color: string; leftPercent: number }> = ({
  delay,
  color,
  leftPercent,
}) => (
  <div
    className="absolute w-2 h-2 rounded-full animate-confetti"
    style={{
      left: `${leftPercent}%`,
      backgroundColor: color,
      animationDelay: `${delay}ms`,
    }}
    aria-hidden="true"
  />
);

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon = '🎉',
  badgeImageUrl,
  achievementName,
  ctaText = 'Continue',
  onCtaClick,
  type = 'badge',
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Clean up confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleCta = () => {
    if (onCtaClick) {
      onCtaClick();
    }
    onClose();
  };

  const confettiColors = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa'];

  // Pre-compute confetti positions to avoid Math.random() during render
  const confettiPositions = useMemo(
    () => Array.from({ length: 30 }, (_, i) => (i * 37 + 13) % 100),
    []
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn('sm:max-w-md overflow-hidden', 'animate-in zoom-in-95 duration-300')}
      >
        {/* Confetti container */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {Array.from({ length: 30 }).map((_, i) => (
              <ConfettiParticle
                key={i}
                delay={i * 50}
                color={confettiColors[i % confettiColors.length]}
                leftPercent={confettiPositions[i]}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col items-center text-center py-6 px-4 relative z-10">
          {/* Icon or Badge Image */}
          <div
            className={cn(
              'mb-4 animate-bounce-slow',
              type === 'badge' && 'text-6xl',
              type === 'milestone' && 'text-7xl',
              type === 'achievement' && 'text-5xl'
            )}
          >
            {badgeImageUrl ? (
              <img
                src={badgeImageUrl}
                alt={achievementName || 'Badge'}
                className="w-24 h-24 object-contain rounded-lg shadow-lg"
              />
            ) : (
              <span aria-hidden="true">{icon}</span>
            )}
          </div>

          {/* Title */}
          <DialogTitle className="text-2xl font-bold text-foreground mb-2">{title}</DialogTitle>

          {/* Achievement Name */}
          {achievementName && (
            <p className="text-lg font-semibold text-primary mb-2">{achievementName}</p>
          )}

          {/* Description */}
          {description && <p className="text-muted-foreground mb-6">{description}</p>}

          {/* CTA Button */}
          <Button onClick={handleCta} className="w-full sm:w-auto min-w-[120px]" size="lg">
            {ctaText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Badge Earned celebration preset
 */
export const BadgeEarnedCelebration: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  badgeName: string;
  badgeImageUrl?: string;
  onViewBadge?: () => void;
}> = ({ isOpen, onClose, badgeName, badgeImageUrl, onViewBadge }) => (
  <CelebrationModal
    isOpen={isOpen}
    onClose={onClose}
    title="Congratulations! 🎉"
    achievementName={badgeName}
    description="You've earned a new badge! Share your achievement with colleagues."
    badgeImageUrl={badgeImageUrl}
    icon="🏆"
    type="badge"
    ctaText={onViewBadge ? 'View Badge' : 'Continue'}
    onCtaClick={onViewBadge}
  />
);

/**
 * Milestone Reached celebration preset
 */
export const MilestoneReachedCelebration: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  milestoneName: string;
  description?: string;
}> = ({ isOpen, onClose, milestoneName, description }) => (
  <CelebrationModal
    isOpen={isOpen}
    onClose={onClose}
    title="Milestone Achieved! 🌟"
    achievementName={milestoneName}
    description={description || "You've reached an important milestone on your journey!"}
    icon="🏅"
    type="milestone"
  />
);

export default CelebrationModal;
