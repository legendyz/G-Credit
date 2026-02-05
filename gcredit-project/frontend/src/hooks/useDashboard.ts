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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Fetch helper with auth
 */
async function fetchWithAuth<T>(endpoint: string): Promise<T> {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * AC1: Employee Dashboard Hook
 * Fetches badge summary, milestones, and recent badges
 * Auto-refreshes every 60 seconds when tab is active
 */
export function useEmployeeDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'employee'],
    queryFn: () => fetchWithAuth<EmployeeDashboard>('/api/dashboard/employee'),
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
export function useIssuerDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'issuer'],
    queryFn: () => fetchWithAuth<IssuerDashboard>('/api/dashboard/issuer'),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000, // 60 seconds auto-refresh
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

/**
 * AC3: Manager Dashboard Hook
 * Fetches team insights and revocation alerts
 * Auto-refreshes every 60 seconds when tab is active
 */
export function useManagerDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'manager'],
    queryFn: () => fetchWithAuth<ManagerDashboard>('/api/dashboard/manager'),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000, // 60 seconds auto-refresh
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

/**
 * AC4: Admin Dashboard Hook
 * Fetches system overview and recent activity
 * Auto-refreshes every 60 seconds when tab is active
 */
export function useAdminDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => fetchWithAuth<AdminDashboard>('/api/dashboard/admin'),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000, // 60 seconds auto-refresh
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

/**
 * Combined dashboard hook that fetches appropriate data based on role
 */
export function useDashboard(role: 'EMPLOYEE' | 'ISSUER' | 'MANAGER' | 'ADMIN') {
  const employeeQuery = useEmployeeDashboard();
  const issuerQuery = useIssuerDashboard();
  const managerQuery = useManagerDashboard();
  const adminQuery = useAdminDashboard();

  switch (role) {
    case 'ADMIN':
      return {
        employee: employeeQuery,
        issuer: issuerQuery,
        manager: managerQuery,
        admin: adminQuery,
      };
    case 'MANAGER':
      return {
        employee: employeeQuery,
        manager: managerQuery,
      };
    case 'ISSUER':
      return {
        employee: employeeQuery,
        issuer: issuerQuery,
      };
    default:
      return {
        employee: employeeQuery,
      };
  }
}
