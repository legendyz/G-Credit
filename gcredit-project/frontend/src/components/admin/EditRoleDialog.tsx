/**
 * EditRoleDialog Component - Story 8.10 (AC2)
 *
 * Dialog for editing a user's role with:
 * - Role dropdown selection
 * - Audit note textarea (optional)
 * - Inline warnings for Admin role changes
 * - Optimistic locking via roleVersion
 *
 * WCAG 4.1.2 Compliant:
 * - role="dialog", aria-modal="true", aria-labelledby
 * - Focus trap (Tab cycles within dialog)
 * - Focus management: Open → dropdown, Close → return to trigger
 * - Escape key closes dialog
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useUpdateUserRole } from '@/hooks/useAdminUsers';
import { RoleBadge } from './RoleBadge';
import type { AdminUser, UserRole } from '@/lib/adminUsersApi';

interface EditRoleDialogProps {
  user: AdminUser;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

const ROLES: UserRole[] = ['ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE'];

export function EditRoleDialog({
  user,
  currentUserId,
  isOpen,
  onClose,
  triggerRef,
}: EditRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [auditNote, setAuditNote] = useState('');
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);
  const dialogRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onClose,
    returnFocusRef: triggerRef,
    autoFocus: true,
  });

  const selectRef = useRef<HTMLButtonElement>(null);
  const updateRoleMutation = useUpdateUserRole();

  // Check if editing own role
  const isOwnRole = user.id === currentUserId;

  // Check if Admin role is involved (for warning)
  const isAdminRoleChange =
    selectedRole !== user.role && (user.role === 'ADMIN' || selectedRole === 'ADMIN');

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedRole(user.role);
      setAuditNote('');
      setShowAdminConfirm(false);
    }
  }, [isOpen, user.role]);

  // Focus the select when dialog opens
  useEffect(() => {
    if (isOpen && selectRef.current) {
      // Small delay to ensure dialog is rendered
      const timer = setTimeout(() => {
        selectRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSave = useCallback(async () => {
    if (selectedRole === user.role) {
      onClose();
      return;
    }

    // AC2: Require confirmation for Admin role changes
    if (isAdminRoleChange && !showAdminConfirm) {
      setShowAdminConfirm(true);
      return;
    }

    try {
      await updateRoleMutation.mutateAsync({
        userId: user.id,
        data: {
          role: selectedRole,
          roleVersion: user.roleVersion,
          auditNote: auditNote.trim() || undefined,
        },
      });

      toast.success(`Role updated successfully for ${user.firstName || user.email}`);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('modified by another')) {
          toast.error(error.message);
        } else {
          toast.error(`Failed to update role: ${error.message}`);
        }
      } else {
        toast.error('Failed to update role');
      }
    }
  }, [
    selectedRole,
    user,
    auditNote,
    updateRoleMutation,
    onClose,
    isAdminRoleChange,
    showAdminConfirm,
  ]);

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
        aria-labelledby="edit-role-title"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2
              id="edit-role-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Edit User Role
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Change role for {userName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:hover:bg-gray-700"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="mb-4 rounded-md bg-gray-50 p-3 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{userName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
            <RoleBadge role={user.role} />
          </div>
        </div>

        {/* Role Selection */}
        <div className="mb-4">
          <label
            htmlFor="role-select"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            New Role
          </label>
          {isOwnRole ? (
            <div
              className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-100 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
              title="You cannot change your own role"
            >
              <span className="text-gray-500 dark:text-gray-400">{user.role}</span>
              <span className="text-xs text-gray-400">Cannot change own role</span>
            </div>
          ) : (
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
            >
              <SelectTrigger
                ref={selectRef}
                id="role-select"
                className="w-full focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center gap-2">
                      <RoleBadge role={role} />
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Admin Role Warning and Confirmation Step */}
        {isAdminRoleChange && !isOwnRole && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-900/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {selectedRole === 'ADMIN'
                    ? '⚠️ Admin Promotion Warning'
                    : '⚠️ Admin Demotion Warning'}
                </p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  {selectedRole === 'ADMIN'
                    ? 'This user will gain full administrative access including user management.'
                    : 'This will remove their access to user management functions.'}
                </p>
                {showAdminConfirm && (
                  <p className="mt-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
                    Click "Confirm Change" again to proceed.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Audit Note */}
        <div className="mb-4">
          <label
            htmlFor="audit-note"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Reason for change <span className="text-gray-400">(optional, max 200 chars)</span>
          </label>
          <Textarea
            id="audit-note"
            value={auditNote}
            onChange={(e) => setAuditNote(e.target.value.slice(0, 200))}
            placeholder="e.g., Promoted to badge issuer for HR department"
            rows={2}
            maxLength={200}
            disabled={isOwnRole}
            className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{auditNote.length}/200</p>
        </div>

        {/* Warning Message */}
        {selectedRole !== user.role && !isOwnRole && (
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Changing role will affect user's access permissions.
          </p>
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
            onClick={handleSave}
            disabled={isOwnRole || selectedRole === user.role || updateRoleMutation.isPending}
            className={`min-w-[80px] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              showAdminConfirm ? 'bg-amber-600 hover:bg-amber-700' : ''
            }`}
          >
            {updateRoleMutation.isPending
              ? 'Saving...'
              : showAdminConfirm
                ? 'Confirm Change'
                : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EditRoleDialog;
