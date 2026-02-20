/**
 * UserDetailPanel Component - Story 12.3b (AC #8, #14)
 *
 * Slide-over panel showing detailed user information.
 * Uses Shadcn Sheet for the slide-in from right.
 *
 * Sections:
 * 1. Header: Avatar initials, name, email, SourceBadge
 * 2. Account Info: role, status, department, manager, created, last login
 * 3. Source section: M365 sync notice or Local account info
 * 4. Badge summary
 * 5. Actions (context-aware for M365 vs Local)
 */

import { formatDistanceToNow, format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { SourceBadge } from './SourceBadge';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';
import type { AdminUser } from '@/lib/adminUsersApi';

interface UserDetailPanelProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailPanel({ user, isOpen, onClose }: UserDetailPanelProps) {
  if (!user) return null;

  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  const initials =
    [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join('').toUpperCase() ||
    user.email[0].toUpperCase();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
  };

  const formatRelative = (dateStr: string | null) => {
    if (!dateStr) return null;
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="pb-4">
          <SheetTitle className="sr-only">User Details</SheetTitle>

          {/* Header: Avatar + Name + Source */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-200">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                {userName}
              </h3>
              <p className="truncate text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              <div className="mt-1">
                <SourceBadge source={user.source} />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 pt-2">
          {/* Account Info */}
          <section>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Account Information
            </h4>
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Role</dt>
                <dd>
                  <RoleBadge role={user.role} />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Status</dt>
                <dd>
                  <StatusBadge isActive={user.isActive} />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Department</dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  {user.department || '\u2014'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Role Set Manually</dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  {user.roleSetManually ? 'Yes' : 'No'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Created</dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  {formatDate(user.createdAt)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Last Login</dt>
                <dd
                  className="text-sm text-gray-900 dark:text-white"
                  title={formatDate(user.lastLoginAt)}
                >
                  {formatRelative(user.lastLoginAt) || 'Never'}
                </dd>
              </div>
              {user.failedLoginAttempts > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Failed Logins</dt>
                  <dd className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {user.failedLoginAttempts}
                  </dd>
                </div>
              )}
              {user.lockedUntil && (
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Locked Until</dt>
                  <dd className="text-sm font-medium text-red-600 dark:text-red-400">
                    {formatDate(user.lockedUntil)}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Source Section (AC #14) */}
          <section>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Identity Source
            </h4>
            {user.source === 'M365' ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-200">
                <p className="font-medium">Identity managed by Microsoft 365</p>
                <p className="mt-1 text-blue-600 dark:text-blue-300">
                  Role assigned via Security Group membership.
                </p>
                {user.lastSyncAt && (
                  <p className="mt-1 text-xs text-blue-500 dark:text-blue-400">
                    Last synced: {formatRelative(user.lastSyncAt)}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <p className="font-medium">Local Account</p>
                <p className="mt-1 text-gray-500 dark:text-gray-400">
                  Identity managed within G-Credit.
                </p>
              </div>
            )}
          </section>

          {/* Badge Summary */}
          <section>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Badges
            </h4>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {user.badgeCount} badge{user.badgeCount !== 1 ? 's' : ''} received
              </Badge>
            </div>
          </section>

          {/* Direct Reports */}
          {user.directReportsCount > 0 && (
            <section>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Team
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Manages <strong>{user.directReportsCount}</strong> direct report
                {user.directReportsCount !== 1 ? 's' : ''}
              </p>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default UserDetailPanel;
