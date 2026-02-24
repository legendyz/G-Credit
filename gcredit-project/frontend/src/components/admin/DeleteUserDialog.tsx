/**
 * DeleteUserDialog Component - Story 12.3b
 *
 * Confirmation dialog for deleting a local user.
 * - Only shown for local users (source === 'LOCAL')
 * - Shows subordinate warning if user manages others
 * - Self-delete blocked
 * - Destructive action
 *
 * WCAG 4.1.2 Compliant
 */

import { useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useDeleteUser } from '@/hooks/useAdminUsers';
import type { AdminUser } from '@/lib/adminUsersApi';

interface DeleteUserDialogProps {
  user: AdminUser;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function DeleteUserDialog({
  user,
  currentUserId,
  isOpen,
  onClose,
  triggerRef,
}: DeleteUserDialogProps) {
  const dialogRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onClose,
    returnFocusRef: triggerRef,
    autoFocus: true,
  });

  const deleteUserMutation = useDeleteUser();

  const isSelf = user.id === currentUserId;
  const hasSubordinates = (user.directReportsCount ?? 0) > 0;
  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  const handleConfirm = useCallback(async () => {
    try {
      await deleteUserMutation.mutateAsync(user.id);
      toast.success(`User ${userName} has been deleted`);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete user');
      }
    }
  }, [user.id, userName, deleteUserMutation, onClose]);

  if (!isOpen) return null;

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
        aria-labelledby="delete-user-title"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <h2
              id="delete-user-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Delete User
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
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to permanently delete <strong>{userName}</strong>?
            <br />
            <br />
            This action cannot be undone.
          </p>
        </div>

        {/* Subordinate warning */}
        {hasSubordinates && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
            <p>
              This user manages <strong>{user.directReportsCount}</strong> user
              {user.directReportsCount !== 1 ? 's' : ''}. Their manager will be unassigned.
            </p>
          </div>
        )}

        {/* Self-delete warning */}
        {isSelf && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-200">
              You cannot delete your own account.
            </p>
          </div>
        )}

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
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSelf || deleteUserMutation.isPending}
            className="min-w-[100px] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DeleteUserDialog;
