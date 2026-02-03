/**
 * UserListTable Component - Story 8.10 (AC1)
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
 */

import { useState, useRef, useCallback } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { ArrowUpDown, ArrowUp, ArrowDown, Pencil, UserX, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';
import { EditRoleDialog } from './EditRoleDialog';
import { DeactivateUserDialog } from './DeactivateUserDialog';
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';
import type { AdminUser } from '@/lib/adminUsersApi';

interface UserListTableProps {
  users: AdminUser[];
  currentUserId: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
}

type SortField = 'name' | 'email' | 'role' | 'lastLogin' | 'createdAt';

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
  const [dialogType, setDialogType] = useState<'role' | 'status' | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

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

  // Sort header component
  const SortHeader = ({
    field,
    children,
    className = '',
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => {
    const isActive = sortBy === field;
    return (
      <th className={`px-4 py-3 text-left ${className}`}>
        <button
          onClick={() => handleSort(field)}
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
  };

  // Open dialog handlers
  const openRoleDialog = useCallback(
    (user: AdminUser, buttonRef: HTMLButtonElement) => {
      setSelectedUser(user);
      setDialogType('role');
      triggerRef.current = buttonRef;
    },
    []
  );

  const openStatusDialog = useCallback(
    (user: AdminUser, buttonRef: HTMLButtonElement) => {
      setSelectedUser(user);
      setDialogType('status');
      triggerRef.current = buttonRef;
    },
    []
  );

  const closeDialog = useCallback(() => {
    setSelectedUser(null);
    setDialogType(null);
  }, []);

  // Mobile card view
  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {users.map((user) => {
            const lastLogin = formatLastLogin(user.lastLoginAt);
            return (
              <div
                key={user.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {getDisplayName(user)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <StatusBadge isActive={user.isActive} />
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <RoleBadge role={user.role} />
                  {user.department && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      • {user.department}
                    </span>
                  )}
                </div>
                <div className="mb-3 text-sm text-gray-500 dark:text-gray-400" title={lastLogin.absolute}>
                  Last login: {lastLogin.relative}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px] min-w-[44px] flex-1 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={(e) => openRoleDialog(user, e.currentTarget)}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    Edit Role
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`min-h-[44px] min-w-[44px] flex-1 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      user.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                    }`}
                    onClick={(e) => openStatusDialog(user, e.currentTarget)}
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
                </div>
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
      </>
    );
  }

  // Tablet/Desktop table view
  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <SortHeader field="name">Name</SortHeader>
              <SortHeader field="email" className={isTablet ? 'hidden md:table-cell' : ''}>
                Email
              </SortHeader>
              <SortHeader field="role">Role</SortHeader>
              {!isTablet && <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Department</th>}
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
              <SortHeader field="lastLogin">Last Login</SortHeader>
              <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
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
                      const nextRow = (e.currentTarget.nextElementSibling as HTMLElement);
                      nextRow?.focus();
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      const prevRow = (e.currentTarget.previousElementSibling as HTMLElement);
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
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {user.department || '—'}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge isActive={user.isActive} />
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400"
                    title={lastLogin.absolute}
                  >
                    {lastLogin.relative}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
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
    </>
  );
}

export default UserListTable;
