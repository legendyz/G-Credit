/**
 * Dashboard API Hooks - Story 8.1
 *
 * TanStack Query hooks for fetching dashboard data.
 */

import { useQuery } from '@tanstack/react-query';
import type {
  EmployeeDashboard,
  IssuerDashboard,
  ManagerDashboard,
  AdminDashboard,
} from '../types/dashboard';
import { apiFetchJson } from '../lib/apiFetch';

/**
 * AC1: Employee Dashboard Hook
 * Fetches badge summary, milestones, and recent badges
 * Auto-refreshes every 60 seconds when tab is active
 */
export function useEmployeeDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'employee'],
    queryFn: () => apiFetchJson<EmployeeDashboard>('/dashboard/employee'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 60 seconds auto-refresh (AC1 requirement)
    refetchIntervalInBackground: false, // Only when tab is active
    refetchOnWindowFocus: true,
  });
}

/**
 * AC2: Issuer Dashboard Hook
 * Fetches issuance summary and recent activity
 * Auto-refreshes every 60 seconds when tab is active
 */
export function useIssuerDashboard(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['dashboard', 'issuer'],
    queryFn: () => apiFetchJson<IssuerDashboard>('/dashboard/issuer'),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000, // 60 seconds auto-refresh
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
  });
}

/**
 * AC3: Manager Dashboard Hook
 * Fetches team insights and revocation alerts
 * Auto-refreshes every 60 seconds when tab is active
 */
export function useManagerDashboard(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['dashboard', 'manager'],
    queryFn: () => apiFetchJson<ManagerDashboard>('/dashboard/manager'),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000, // 60 seconds auto-refresh
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
  });
}

/**
 * AC4: Admin Dashboard Hook
 * Fetches system overview and recent activity
 * Auto-refreshes every 60 seconds when tab is active
 */
export function useAdminDashboard(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => apiFetchJson<AdminDashboard>('/dashboard/admin'),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000, // 60 seconds auto-refresh
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Combined dashboard hook that fetches appropriate data based on role
 * ADR-017: isManager parameter controls manager dashboard access
 */
export function useDashboard(role: 'EMPLOYEE' | 'ISSUER' | 'ADMIN', isManager?: boolean) {
  const isAdmin = role === 'ADMIN';
  const isIssuer = role === 'ISSUER';
  const needsManager = isAdmin || !!isManager;

  const employeeQuery = useEmployeeDashboard();
  const issuerQuery = useIssuerDashboard({ enabled: isAdmin || isIssuer });
  const managerQuery = useManagerDashboard({ enabled: needsManager });
  const adminQuery = useAdminDashboard({ enabled: isAdmin });

  switch (role) {
    case 'ADMIN':
      return {
        employee: employeeQuery,
        issuer: issuerQuery,
        manager: managerQuery,
        admin: adminQuery,
      };
    case 'ISSUER':
      return {
        employee: employeeQuery,
        issuer: issuerQuery,
      };
    default:
      if (isManager) {
        return {
          employee: employeeQuery,
          manager: managerQuery,
        };
      }
      return {
        employee: employeeQuery,
      };
  }
}
