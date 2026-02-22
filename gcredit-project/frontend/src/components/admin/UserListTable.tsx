/**
 * UserListTable Component - Story 8.10 (AC1), 12.3b (AC #1, #5, #9, #10, #13)
 *
 * Responsive table for displaying users with:
 * - Mobile (<640px): Card layout
 * - Tablet (640-1024px): Condensed table (hide Department)
 * - Desktop (≥1024px): Full table with all columns
 *
 * Features:
 * - Sort by column headers (click to toggle)
 * - Keyboard navigation (Tab, Enter, Arrow keys)
 * - Focus indicators (3px solid #3B82F6)
 * - Touch targets ≥44×44px for action buttons
 * - Source badge (M365 / Local)
 * - Context-aware actions (M365: view+lock; Local: edit+view+lock+delete)
 */

import { useState, useRef, useCallback } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  UserX,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Check,
  X as XIcon,
  Eye,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';
import { SourceBadge } from './SourceBadge';
import { EditRoleDialog } from './EditRoleDialog';
import { DeactivateUserDialog } from './DeactivateUserDialog';
import { DeleteUserDialog } from './DeleteUserDialog';
import { UserDetailPanel } from './UserDetailPanel';
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';
import { useUpdateUserDepartment } from '@/hooks/useAdminUsers';
import type { AdminUser } from '@/lib/adminUsersApi';

interface UserListTableProps {
  users: AdminUser[];
  currentUserId: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
}

type SortField =
  | 'name'
  | 'email'
  | 'role'
  | 'department'
  | 'status'
  | 'lastLogin'
  | 'createdAt'
  | 'source'
  | 'badgeCount';

/** Sort header component (extracted to avoid creating components during render) */
function SortHeader({
  field,
  children,
  className = '',
  sortBy,
  sortOrder,
  onSort,
}: {
  field: SortField;
  children: React.ReactNode;
  className?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: SortField) => void;
}) {
  const isActive = sortBy === field;
  return (
    <th className={`px-4 py-3 text-left ${className}`}>
      <button
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 font-medium text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label={`Sort by ${field}`}
      >
        {children}
        {isActive ? (
          sortOrder === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </button>
    </th>
  );
}

export function UserListTable({
  users,
  currentUserId,
  sortBy,
  sortOrder,
  onSort,
}: UserListTableProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [dialogType, setDialogType] = useState<'role' | 'status' | 'delete' | null>(null);
  const [detailPanelUser, setDetailPanelUser] = useState<AdminUser | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [editingDeptUserId, setEditingDeptUserId] = useState<string | null>(null);
  const [editingDeptValue, setEditingDeptValue] = useState('');
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const deptInputRef = useRef<HTMLInputElement | null>(null);
  const updateDeptMutation = useUpdateUserDepartment();

  // Toggle card expansion (mobile only)
  const toggleCardExpand = useCallback((userId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  // Format last login time
  const formatLastLogin = (dateString: string | null) => {
    if (!dateString) return { relative: 'Never', absolute: 'Never logged in' };
    const date = new Date(dateString);
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      absolute: format(date, 'MMM d, yyyy h:mm a'),
    };
  };

  // Get display name
  const getDisplayName = (user: AdminUser) => {
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  };

  // Handle sort click
  const handleSort = useCallback(
    (field: SortField) => {
      onSort(field);
    },
    [onSort]
  );

  // Open dialog handlers
  const openRoleDialog = useCallback((user: AdminUser, buttonRef: HTMLButtonElement) => {
    setSelectedUser(user);
    setDialogType('role');
    triggerRef.current = buttonRef;
  }, []);

  const openStatusDialog = useCallback((user: AdminUser, buttonRef: HTMLButtonElement) => {
    setSelectedUser(user);
    setDialogType('status');
    triggerRef.current = buttonRef;
  }, []);

  const openDeleteDialog = useCallback((user: AdminUser, buttonRef: HTMLButtonElement) => {
    setSelectedUser(user);
    setDialogType('delete');
    triggerRef.current = buttonRef;
  }, []);

  const openDetailPanel = useCallback((user: AdminUser) => {
    setDetailPanelUser(user);
  }, []);

  const closeDetailPanel = useCallback(() => {
    setDetailPanelUser(null);
  }, []);

  const closeDialog = useCallback(() => {
    setSelectedUser(null);
    setDialogType(null);
  }, []);

  // Inline department editing
  const startEditDept = useCallback((user: AdminUser) => {
    setEditingDeptUserId(user.id);
    setEditingDeptValue(user.department || '');
    setTimeout(() => deptInputRef.current?.focus(), 50);
  }, []);

  const saveDept = useCallback(
    async (userId: string) => {
      const trimmed = editingDeptValue.trim();
      if (!trimmed) {
        setEditingDeptUserId(null);
        return;
      }
      try {
        await updateDeptMutation.mutateAsync({
          userId,
          data: { department: trimmed },
        });
        toast.success('Department updated');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update department');
      }
      setEditingDeptUserId(null);
    },
    [editingDeptValue, updateDeptMutation]
  );

  const cancelEditDept = useCallback(() => {
    setEditingDeptUserId(null);
  }, []);

  // Mobile card view with tap-to-expand (AC1)
  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {users.map((user) => {
            const lastLogin = formatLastLogin(user.lastLoginAt);
            const isExpanded = expandedCards.has(user.id);
            return (
              <div
                key={user.id}
                className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                {/* Collapsed view: Name + Role + Actions only (AC1 compliant) */}
                <button
                  onClick={() => toggleCardExpand(user.id)}
                  className="w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  aria-expanded={isExpanded}
                  aria-controls={`user-details-${user.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getDisplayName(user)}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <RoleBadge role={user.role} />
                          <SourceBadge source={user.source} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge isActive={user.isActive} />
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded view: Additional details */}
                {isExpanded && (
                  <div
                    id={`user-details-${user.id}`}
                    className="border-t border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="mb-3 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                      <p>{user.email}</p>
                      {user.department && <p>Department: {user.department}</p>}
                      <p title={lastLogin.absolute}>Last login: {lastLogin.relative}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-[44px] min-w-[44px] flex-1 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetailPanel(user);
                        }}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                      {user.source === 'LOCAL' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-[44px] min-w-[44px] flex-1 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            openRoleDialog(user, e.currentTarget);
                          }}
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          Edit Role
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className={`min-h-[44px] min-w-[44px] flex-1 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          user.isActive
                            ? 'text-red-600 hover:text-red-700'
                            : 'text-green-600 hover:text-green-700'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openStatusDialog(user, e.currentTarget);
                        }}
                      >
                        {user.isActive ? (
                          <>
                            <UserX className="mr-1 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-1 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </Button>
                      {user.source === 'LOCAL' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-[44px] min-w-[44px] flex-1 text-red-600 hover:text-red-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog(user, e.currentTarget);
                          }}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Dialogs */}
        {selectedUser && dialogType === 'role' && (
          <EditRoleDialog
            user={selectedUser}
            currentUserId={currentUserId}
            isOpen={true}
            onClose={closeDialog}
            triggerRef={triggerRef}
          />
        )}
        {selectedUser && dialogType === 'status' && (
          <DeactivateUserDialog
            user={selectedUser}
            currentUserId={currentUserId}
            isOpen={true}
            onClose={closeDialog}
            triggerRef={triggerRef}
          />
        )}
        {selectedUser && dialogType === 'delete' && (
          <DeleteUserDialog
            user={selectedUser}
            currentUserId={currentUserId}
            isOpen={true}
            onClose={closeDialog}
            triggerRef={triggerRef}
          />
        )}
        <UserDetailPanel
          user={detailPanelUser}
          isOpen={!!detailPanelUser}
          onClose={closeDetailPanel}
        />
      </>
    );
  }

  // Tablet/Desktop table view with pinned actions column (AC1)
  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <SortHeader field="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                Name
              </SortHeader>
              <SortHeader
                field="email"
                className={isTablet ? 'hidden md:table-cell' : ''}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              >
                Email
              </SortHeader>
              <SortHeader field="role" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                Role
              </SortHeader>
              {!isTablet && (
                <SortHeader
                  field="source"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                >
                  Source
                </SortHeader>
              )}
              {!isTablet && (
                <SortHeader
                  field="department"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                >
                  Department
                </SortHeader>
              )}
              <SortHeader field="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                Status
              </SortHeader>
              {!isTablet && (
                <SortHeader
                  field="badgeCount"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                >
                  Badges
                </SortHeader>
              )}
              <SortHeader
                field="lastLogin"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              >
                Last Login
              </SortHeader>
              {/* Pinned Actions column with sticky positioning */}
              <th className="sticky right-0 bg-gray-50 px-4 py-3 text-right font-medium text-gray-500 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] dark:bg-gray-800 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {users.map((user) => {
              const lastLogin = formatLastLogin(user.lastLoginAt);
              return (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 focus-within:bg-gray-50 dark:hover:bg-gray-800 dark:focus-within:bg-gray-800"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      const nextRow = e.currentTarget.nextElementSibling as HTMLElement;
                      nextRow?.focus();
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      const prevRow = e.currentTarget.previousElementSibling as HTMLElement;
                      prevRow?.focus();
                    }
                  }}
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getDisplayName(user)}
                      </p>
                      {isTablet && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      )}
                    </div>
                  </td>
                  {!isTablet && (
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  {!isTablet && (
                    <td className="whitespace-nowrap px-4 py-3">
                      <SourceBadge source={user.source} />
                    </td>
                  )}
                  {!isTablet && (
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {editingDeptUserId === user.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            ref={deptInputRef}
                            type="text"
                            value={editingDeptValue}
                            onChange={(e) => setEditingDeptValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveDept(user.id);
                              if (e.key === 'Escape') cancelEditDept();
                            }}
                            className="w-28 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                          />
                          <button
                            onClick={() => saveDept(user.id)}
                            className="p-1 text-green-600 hover:text-green-700"
                            title="Save"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={cancelEditDept}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Cancel"
                          >
                            <XIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className="cursor-pointer hover:text-blue-600 hover:underline"
                          onClick={() => startEditDept(user)}
                          title="Click to edit department"
                        >
                          {user.department || '—'}
                        </span>
                      )}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge isActive={user.isActive} />
                  </td>
                  {!isTablet && (
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {user.badgeCount}
                    </td>
                  )}
                  <td
                    className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400"
                    title={lastLogin.absolute}
                  >
                    {lastLogin.relative}
                  </td>
                  {/* Pinned Actions cell — context-aware (AC #10) */}
                  <td className="sticky right-0 whitespace-nowrap bg-white px-4 py-3 text-right shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] dark:bg-gray-900">
                    <div className="flex justify-end gap-1">
                      {/* View details — all users */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="min-h-[44px] min-w-[44px] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={() => openDetailPanel(user)}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View details</span>
                      </Button>
                      {/* Edit role — local users only */}
                      {user.source === 'LOCAL' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-[44px] min-w-[44px] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          onClick={(e) => openRoleDialog(user, e.currentTarget)}
                          title="Edit role"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit role</span>
                        </Button>
                      )}
                      {/* Lock/Unlock — all users */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`min-h-[44px] min-w-[44px] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          user.isActive
                            ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                        }`}
                        onClick={(e) => openStatusDialog(user, e.currentTarget)}
                        title={user.isActive ? 'Deactivate user' : 'Activate user'}
                      >
                        {user.isActive ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                        <span className="sr-only">{user.isActive ? 'Deactivate' : 'Activate'}</span>
                      </Button>
                      {/* Delete — local users only */}
                      {user.source === 'LOCAL' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-[44px] min-w-[44px] text-red-600 hover:text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:hover:bg-red-900/20"
                          onClick={(e) => openDeleteDialog(user, e.currentTarget)}
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete user</span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Dialogs */}
      {selectedUser && dialogType === 'role' && (
        <EditRoleDialog
          user={selectedUser}
          currentUserId={currentUserId}
          isOpen={true}
          onClose={closeDialog}
          triggerRef={triggerRef}
        />
      )}
      {selectedUser && dialogType === 'status' && (
        <DeactivateUserDialog
          user={selectedUser}
          currentUserId={currentUserId}
          isOpen={true}
          onClose={closeDialog}
          triggerRef={triggerRef}
        />
      )}
      {selectedUser && dialogType === 'delete' && (
        <DeleteUserDialog
          user={selectedUser}
          currentUserId={currentUserId}
          isOpen={true}
          onClose={closeDialog}
          triggerRef={triggerRef}
        />
      )}
      <UserDetailPanel
        user={detailPanelUser}
        isOpen={!!detailPanelUser}
        onClose={closeDetailPanel}
      />
    </>
  );
}

export default UserListTable;
