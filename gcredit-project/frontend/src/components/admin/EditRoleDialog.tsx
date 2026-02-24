/**
 * EditRoleDialog Component - Story 8.10 (AC2) + 12.5
 *
 * Dialog for editing a user's role and manager assignment with:
 * - Role dropdown selection (ADMIN, ISSUER)
 * - Manager dropdown (active LOCAL users, excludes self)
 * - Audit note textarea (optional, shared for both changes)
 * - Inline warnings for Admin role changes
 * - Optimistic locking via roleVersion
 * - Auto-upgrade/downgrade banners from manager change response
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
import { useUpdateUserRole, useUpdateUserManager, useAdminUsers } from '@/hooks/useAdminUsers';
import { RoleBadge } from './RoleBadge';
import type { AdminUser, UserRole } from '@/lib/adminUsersApi';

interface EditRoleDialogProps {
  user: AdminUser;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

// MANAGER and EMPLOYEE are auto-managed via managerId relationships:
// - Assigning subordinates → auto-upgrade to MANAGER
// - Losing all subordinates → auto-downgrade to EMPLOYEE
// Only ADMIN and ISSUER are manually assignable.
const ROLES: UserRole[] = ['ADMIN', 'ISSUER'];

export function EditRoleDialog({
  user,
  currentUserId,
  isOpen,
  onClose,
  triggerRef,
}: EditRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [selectedManagerId, setSelectedManagerId] = useState<string>(user.managerId ?? '__none__');
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
  const updateManagerMutation = useUpdateUserManager();

  // Fetch active LOCAL users for Manager dropdown
  const { data: usersData, isLoading: managersLoading } = useAdminUsers({
    limit: 100,
    statusFilter: 'ACTIVE',
    sourceFilter: 'LOCAL',
    sortBy: 'name',
    sortOrder: 'asc',
  });
  // Exclude the user being edited — cannot be own manager
  const potentialManagers = (usersData?.data ?? []).filter((u) => u.id !== user.id);

  // Check if editing own role
  const isOwnRole = user.id === currentUserId;

  // Check if Admin role is involved (for warning)
  const isAdminRoleChange =
    selectedRole !== user.role && (user.role === 'ADMIN' || selectedRole === 'ADMIN');

  // Detect changes
  const roleChanged = selectedRole !== user.role;
  const currentManagerId = user.managerId ?? '__none__';
  const managerChanged = selectedManagerId !== currentManagerId;
  const hasChanges = roleChanged || managerChanged;

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedRole(user.role);
      setSelectedManagerId(user.managerId ?? '__none__');
      setAuditNote('');
      setShowAdminConfirm(false);
    }
  }, [isOpen, user.role, user.managerId]);

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
    if (!hasChanges) {
      onClose();
      return;
    }

    // AC2: Require confirmation for Admin role changes
    if (isAdminRoleChange && !showAdminConfirm) {
      setShowAdminConfirm(true);
      return;
    }

    const noteText = auditNote.trim() || undefined;
    const results: string[] = [];

    try {
      // 1. Save role change if changed
      if (roleChanged && !isOwnRole) {
        await updateRoleMutation.mutateAsync({
          userId: user.id,
          data: {
            role: selectedRole,
            roleVersion: user.roleVersion,
            auditNote: noteText,
          },
        });
        results.push('Role updated');
      }

      // 2. Save manager change if changed
      if (managerChanged) {
        const newManagerId = selectedManagerId === '__none__' ? null : selectedManagerId;
        const response = await updateManagerMutation.mutateAsync({
          userId: user.id,
          data: {
            managerId: newManagerId,
            auditNote: noteText,
          },
        });
        results.push('Manager updated');

        // Show auto-upgrade/downgrade info
        if (response.managerAutoUpgraded) {
          toast.info(`${response.managerAutoUpgraded.managerId} was auto-promoted to MANAGER`);
        }
        if (response.managerAutoDowngraded) {
          toast.info(`${response.managerAutoDowngraded.managerId} was auto-demoted from MANAGER`);
        }
      }

      toast.success(`${results.join(' & ')} for ${user.firstName || user.email}`);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('modified by another')) {
          toast.error(error.message);
        } else {
          toast.error(`Failed to save: ${error.message}`);
        }
      } else {
        toast.error('Failed to save changes');
      }
    }
  }, [
    hasChanges,
    roleChanged,
    managerChanged,
    selectedRole,
    selectedManagerId,
    user,
    auditNote,
    updateRoleMutation,
    updateManagerMutation,
    onClose,
    isOwnRole,
    isAdminRoleChange,
    showAdminConfirm,
  ]);

  if (!isOpen) return null;

  // M365 users: role is managed by Security Group — cannot edit (12.3b AC #6)
  if (user.source === 'M365') {
    return null;
  }

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
              Edit User
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Update role and manager for {userName}
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

        {/* Manager Assignment */}
        <div className="mb-4">
          <label
            htmlFor="manager-select"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Manager
          </label>
          {user.managerName && (
            <p className="mb-1.5 text-xs text-gray-400">
              Current: {user.managerName} ({user.managerEmail})
            </p>
          )}
          <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
            <SelectTrigger
              id="manager-select"
              className="w-full focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <SelectValue placeholder="None (no manager)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None (no manager)</SelectItem>
              {managersLoading && (
                <div className="px-2 py-1.5 text-sm text-gray-500">Loading...</div>
              )}
              {potentialManagers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        {hasChanges && !isOwnRole && (
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {roleChanged && managerChanged
              ? 'Changing role and manager will affect access and reporting.'
              : roleChanged
                ? 'Changing role will affect access permissions.'
                : 'Changing manager will affect reporting structure.'}
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
            disabled={
              (isOwnRole && !managerChanged) ||
              !hasChanges ||
              updateRoleMutation.isPending ||
              updateManagerMutation.isPending
            }
            className={`min-w-[80px] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              showAdminConfirm ? 'bg-amber-600 hover:bg-amber-700' : ''
            }`}
          >
            {updateRoleMutation.isPending || updateManagerMutation.isPending
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
