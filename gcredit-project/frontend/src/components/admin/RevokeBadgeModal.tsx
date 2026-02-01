/**
 * RevokeBadgeModal Component
 * Sprint 7 - Story 9.5: Admin Badge Revocation UI
 * 
 * A confirmation modal for revoking badges with reason selection and notes.
 * Implements AC2: Revocation Confirmation Modal
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Badge } from '@/lib/badgesApi';
import { REVOCATION_REASONS, revokeBadge } from '@/lib/badgesApi';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface RevokeBadgeModalProps {
  /** The badge to revoke */
  badge: Badge | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when revocation is successful */
  onSuccess: () => void;
}

const MAX_NOTES_LENGTH = 1000;

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get recipient display name
 */
function getRecipientName(badge: Badge): string {
  const { firstName, lastName, email } = badge.recipient;
  if (firstName || lastName) {
    return `${firstName || ''} ${lastName || ''}`.trim();
  }
  return email;
}

export function RevokeBadgeModal({
  badge,
  isOpen,
  onClose,
  onSuccess,
}: RevokeBadgeModalProps) {
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setReason('');
      setNotes('');
      setError(null);
      onClose();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!badge || !reason) {
      setError('Please select a revocation reason');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await revokeBadge(badge.id, {
        reason,
        notes: notes.trim() || undefined,
      });

      // AC3: Success toast notification
      toast.success('Badge revoked successfully', {
        description: `${badge.template.name} has been revoked.`,
      });

      // Success - call callback and close
      onSuccess();
      handleOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to revoke badge';
      setError(message);
      // AC3: Error toast notification
      toast.error('Failed to revoke badge', {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!badge) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px]"
        aria-describedby="revoke-badge-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Revoke Badge - {badge.template.name}
          </DialogTitle>
          <DialogDescription id="revoke-badge-description">
            This action cannot be undone. The badge will be permanently revoked
            and the recipient will be notified.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Badge Info */}
          <div className="rounded-md bg-muted p-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium">Recipient:</span>{' '}
                {getRecipientName(badge)}
              </div>
              <div>
                <span className="font-medium">Issued:</span>{' '}
                {formatDate(badge.issuedAt)}
              </div>
              <div>
                <span className="font-medium">Status:</span>{' '}
                <span className="capitalize">{badge.status.toLowerCase()}</span>
              </div>
              <div>
                <span className="font-medium">Template:</span>{' '}
                {badge.template.name}
              </div>
            </div>
          </div>

          {/* Reason Selection (Required) */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="flex items-center gap-1">
              Revocation Reason <span className="text-destructive">*</span>
            </Label>
            <Select
              value={reason}
              onValueChange={setReason}
              required
            >
              <SelectTrigger 
                id="reason"
                aria-label="Select revocation reason"
                aria-required="true"
              >
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {REVOCATION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes">Additional Notes (optional)</Label>
              <span className="text-xs text-muted-foreground">
                {notes.length}/{MAX_NOTES_LENGTH}
              </span>
            </div>
            <Textarea
              id="notes"
              placeholder="Provide additional context for this revocation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES_LENGTH))}
              maxLength={MAX_NOTES_LENGTH}
              rows={4}
              aria-label="Additional notes for revocation"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div 
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!reason || isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Confirm Revoke'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RevokeBadgeModal;
