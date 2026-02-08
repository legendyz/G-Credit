import { useState, useEffect, useCallback } from 'react';

interface SessionExpiryTimerProps {
  expiresAt: string;
  onExpired: () => void;
}

/**
 * Smart session expiry countdown timer (UX-P1-3)
 *
 * - Hidden when >5 min remaining (reduces anxiety)
 * - Visible with countdown when <=5 min remaining
 * - Calls onExpired when time reaches 0
 */
export default function SessionExpiryTimer({
  expiresAt,
  onExpired,
}: SessionExpiryTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const diff = Math.floor(
      (new Date(expiresAt).getTime() - Date.now()) / 1000,
    );
    return Math.max(0, diff);
  });

  const handleExpired = useCallback(() => {
    onExpired();
  }, [onExpired]);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor(
        (new Date(expiresAt).getTime() - Date.now()) / 1000,
      );
      const newRemaining = Math.max(0, diff);
      setRemainingSeconds(newRemaining);

      if (newRemaining <= 0) {
        clearInterval(interval);
        handleExpired();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [expiresAt, handleExpired]);

  // Hidden when >5 minutes remaining
  if (remainingSeconds > 300) {
    return null;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div
      className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg text-sm font-medium"
      role="timer"
      aria-live="polite"
    >
      <span>⏱️</span>
      <span>
        Preview expires in {timeStr}. Please confirm soon.
      </span>
    </div>
  );
}
