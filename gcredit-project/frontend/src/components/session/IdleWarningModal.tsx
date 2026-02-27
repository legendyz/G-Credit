/**
 * Idle Warning Modal - Story 13.6
 *
 * Non-dismissable dialog that warns user of imminent session expiry.
 * Uses shadcn Dialog with no close button and onInteractOutside prevented.
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface IdleWarningModalProps {
  open: boolean;
  secondsRemaining: number;
  onContinue: () => void;
}

export function IdleWarningModal({ open, secondsRemaining, onContinue }: IdleWarningModalProps) {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md [&>button:last-child]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-amber-700">⚠ Session Expiring</DialogTitle>
          <DialogDescription>
            Your session will expire in{' '}
            <span className="font-mono font-bold text-amber-700">{timeDisplay}</span> due to
            inactivity.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center py-4">
          <div className="text-4xl font-mono font-bold text-amber-700" aria-live="polite">
            {timeDisplay}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onContinue} className="w-full" size="lg">
            Continue Working
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
