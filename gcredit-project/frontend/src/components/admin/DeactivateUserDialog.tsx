/**
 * DeactivateUserDialog Component - Story 8.10 (AC3)
 *
 * Confirmation dialog for activating/deactivating a user.
 * Supports audit note for compliance tracking.
 *
 * WCAG 4.1.2 Compliant:
 * - role="dialog", aria-modal="true", aria-labelledby
 * - Focus trap (Tab cycles within dialog)
 * - Escape key closes dialog
 */

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useUpdateUserStatus } from '@/hooks/useAdminUsers';
import type { AdminUser } from '@/lib/adminUsersApi';

interface DeactivateUserDialogProps {
  user: AdminUser;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function DeactivateUserDialog({
  user,
  currentUserId,
  isOpen,
  onClose,
  triggerRef,
}: DeactivateUserDialogProps) {
  const [auditNote, setAuditNote] = useState('');
  const dialogRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onClose,
    returnFocusRef: triggerRef,
    autoFocus: true,
  });

  const updateStatusMutation = useUpdateUserStatus();

  // Determine action (deactivate or activate)
  const isDeactivating = user.isActive;
  const actionText = isDeactivating ? 'Deactivate' : 'Activate';

  // Check if trying to deactivate self
  const isSelf = user.id === currentUserId;

  // Reset form when dialog opens
  /* eslint-disable react-hooks/set-state-in-effect -- Intentional form reset on dialog open */
  useEffect(() => {
    if (isOpen) {
      setAuditNote('');
    }
  }, [isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleConfirm = useCallback(async () => {
    try {
      await updateStatusMutation.mutateAsync({
        userId: user.id,
        data: {
          isActive: !user.isActive,
          auditNote: auditNote.trim() || undefined,
        },
      });

      const action = user.isActive ? 'deactivated' : 'activated';
      toast.success(`User ${user.firstName || user.email} has been ${action}`);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('modified by another')) {
          toast.error('User was modified by another process. Please refresh and try again.');
        } else {
          toast.error(`Failed to ${actionText.toLowerCase()} user: ${error.message}`);
        }
      } else {
        toast.error(`Failed to ${actionText.toLowerCase()} user`);
      }
    }
  }, [user, auditNote, updateStatusMutation, onClose, actionText]);

  if (!isOpen) return null;

  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deactivate-title"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isDeactivating
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : 'bg-green-100 dark:bg-green-900/30'
              }`}
            >
              <AlertTriangle
                className={`h-5 w-5 ${
                  isDeactivating
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}
              />
            </div>
            <h2
              id="deactivate-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              {actionText} User
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:hover:bg-gray-700"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message */}
        <div className="mb-4">
          {isDeactivating ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to deactivate <strong>{userName}</strong>?
              <br />
              <br />
              They will not be able to log in, but their badges will remain valid.
            </p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to activate <strong>{userName}</strong>?
              <br />
              <br />
              They will be able to log in and access the system again.
            </p>
          )}
        </div>

        {/* Self-deactivation warning */}
        {isSelf && isDeactivating && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-200">
              ⚠️ You cannot deactivate your own account.
            </p>
          </div>
        )}

        {/* Audit Note */}
        <div className="mb-4">
          <label
            htmlFor="status-audit-note"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Reason <span className="text-gray-400">(optional, max 200 chars)</span>
          </label>
          <Textarea
            id="status-audit-note"
            value={auditNote}
            onChange={(e) => setAuditNote(e.target.value.slice(0, 200))}
            placeholder={
              isDeactivating ? 'e.g., User left organization' : 'e.g., User rejoined the company'
            }
            rows={2}
            maxLength={200}
            disabled={isSelf && isDeactivating}
            className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{auditNote.length}/200</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </Button>
          <Button
            variant={isDeactivating ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={(isSelf && isDeactivating) || updateStatusMutation.isPending}
            className="min-w-[100px] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {updateStatusMutation.isPending ? 'Processing...' : actionText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DeactivateUserDialog;
