/**
 * DashboardPage — Story 15.1 (TD-035-A)
 *
 * Tabbed composite dashboard. Shows tabs based on dual-dimension
 * permissions (role × isManager). Default tab: "My Badges" (DEC-016-01).
 *
 * - All visible tabs mounted, non-active hidden via CSS (DEC-15-03)
 * - Data gated by React Query `enabled` flag (MEDIUM-15.1-001)
 * - Hybrid permission: JWT instant + API background verify (DEC-15-01)
 * - URL deep-link via ?tab= param, replace:true (REC-15.1-004)
 *
 * @see ADR-016 DEC-016-01
 */

import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { useAuthStore, useIsManager } from '../../stores/authStore';
import { computeDashboardTabs, type DashboardTab, type UserRole } from '../../utils/permissions';
import { apiFetchJson } from '../../lib/apiFetch';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { ErrorDisplay } from '../../components/common/ErrorDisplay';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { EmployeeDashboard } from './EmployeeDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { IssuerDashboard } from './IssuerDashboard';
import { AdminDashboard } from './AdminDashboard';

/** All valid DashboardTab values for type-safe URL validation */
const VALID_TABS = new Set<string>(['my-badges', 'team', 'issuance', 'admin']);

/** Type-safe check: is a string a valid DashboardTab? */
function isValidTab(value: string | null): value is DashboardTab {
  return value !== null && VALID_TABS.has(value);
}

/** Tab metadata: label for display */
const TAB_LABELS: Record<DashboardTab, string> = {
  'my-badges': 'My Badges',
  team: 'Team Overview',
  issuance: 'Issuance',
  admin: 'Administration',
};

/** Shape returned by GET /api/users/me/permissions (Story 15.2) */
interface UserPermissionsDto {
  role: UserRole;
  isManager: boolean;
  dashboardTabs: string[];
  sidebarGroups: string[];
  permissions: {
    canViewTeam: boolean;
    canIssueBadges: boolean;
    canManageUsers: boolean;
  };
}

export const DashboardPage: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const isManager = useIsManager();

  // --- Loading / Auth guard ---
  if (isLoading) {
    return <PageLoader text="Loading..." />;
  }

  if (!isAuthenticated || !user) {
    return (
      <ErrorDisplay
        title="Not Authenticated"
        message="Please log in to view your dashboard."
        variant="page"
      />
    );
  }

  const role = (user.role ?? 'EMPLOYEE') as UserRole;

  return <DashboardTabs role={role} isManager={isManager} />;
};

/**
 * Inner component that uses hooks unconditionally (no early returns above hooks).
 * Active tab derived from URL ?tab= param — single source of truth.
 */
interface DashboardTabsProps {
  role: UserRole;
  isManager: boolean;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({ role, isManager }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Permission-based tab computation (CROSS-001) ---
  const visibleTabs = useMemo(() => computeDashboardTabs(role, isManager), [role, isManager]);

  // --- Active tab derived from URL (REC-15.1-004) ---
  const urlTab = searchParams.get('tab');
  const activeTab = isValidTab(urlTab) && visibleTabs.includes(urlTab) ? urlTab : 'my-badges';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true }); // No history push
  };

  // --- Background permission verification (DEC-15-01) ---
  const { data: apiPermissions } = useQuery({
    queryKey: ['permissions', 'me'],
    queryFn: () => apiFetchJson<UserPermissionsDto>('/users/me/permissions'),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (
      apiPermissions &&
      (apiPermissions.role !== role || apiPermissions.isManager !== isManager)
    ) {
      // Update authStore — re-render with correct tabs
      useAuthStore.setState((state) => ({
        user: state.user
          ? { ...state.user, role: apiPermissions.role, isManager: apiPermissions.isManager }
          : null,
      }));
    }
  }, [apiPermissions, role, isManager]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="w-full"
      data-testid="dashboard-tabs"
    >
      <TabsList
        className="w-full justify-start overflow-x-auto md:justify-center"
        data-dashboard-tabs
      >
        {visibleTabs.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="min-w-[100px]">
            {TAB_LABELS[tab]}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Mount ALL visible tabs, hide non-active via CSS (DEC-15-03) */}
      {visibleTabs.includes('my-badges') && (
        <TabsContent
          value="my-badges"
          forceMount
          className={activeTab !== 'my-badges' ? 'hidden' : ''}
          data-testid="tab-content-my-badges"
        >
          <ErrorBoundary>
            <EmployeeDashboard />
          </ErrorBoundary>
        </TabsContent>
      )}

      {visibleTabs.includes('team') && (
        <TabsContent
          value="team"
          forceMount
          className={activeTab !== 'team' ? 'hidden' : ''}
          data-testid="tab-content-team"
        >
          <ErrorBoundary>
            <ManagerDashboard enabled={activeTab === 'team'} />
          </ErrorBoundary>
        </TabsContent>
      )}

      {visibleTabs.includes('issuance') && (
        <TabsContent
          value="issuance"
          forceMount
          className={activeTab !== 'issuance' ? 'hidden' : ''}
          data-testid="tab-content-issuance"
        >
          <ErrorBoundary>
            <IssuerDashboard enabled={activeTab === 'issuance'} />
          </ErrorBoundary>
        </TabsContent>
      )}

      {visibleTabs.includes('admin') && (
        <TabsContent
          value="admin"
          forceMount
          className={activeTab !== 'admin' ? 'hidden' : ''}
          data-testid="tab-content-admin"
        >
          <ErrorBoundary>
            <AdminDashboard enabled={activeTab === 'admin'} />
          </ErrorBoundary>
        </TabsContent>
      )}
    </Tabs>
  );
};

export default DashboardPage;
