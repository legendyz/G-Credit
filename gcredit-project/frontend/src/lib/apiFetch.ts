import { API_BASE_URL } from './apiConfig';
import { enqueueRefresh } from './refreshQueue';

/** Paths excluded from 401 interception (avoid circular refresh) */
const EXCLUDED_PATHS = ['/auth/refresh', '/auth/logout'];

function isExcluded(path: string): boolean {
  return EXCLUDED_PATHS.some((p) => path === p);
}

/**
 * Custom error with HTTP status for structured error handling.
 * Used by apiFetchJson(); React Query retry inspects `.status` directly.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Fetch wrapper that includes credentials (httpOnly cookies) automatically.
 * All API calls should go through this wrapper instead of raw fetch().
 *
 * Story 13.5: Enhanced with 401 interceptor → auto-refresh → retry.
 * @see ADR-010: JWT Token Transport Migration
 */
export async function apiFetch(
  path: string,
  options: RequestInit & { _retried?: boolean } = {}
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const { headers: customHeaders, _retried, ...rest } = options;

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  const isFormData = options.body instanceof FormData;
  const defaultHeaders: Record<string, string> = isFormData
    ? {}
    : { 'Content-Type': 'application/json' };

  const response = await fetch(url, {
    ...rest,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...customHeaders,
    },
  });

  // 401 Interception — Story 13.5
  if (response.status === 401 && !isExcluded(path) && !_retried) {
    const refreshed = await enqueueRefresh();

    if (refreshed) {
      // Retry with fresh cookies — mark as retried to prevent infinite loop
      return apiFetch(path, { ...options, _retried: true });
    }

    // Refresh failed → force logout
    // Dynamic import to avoid circular dependency (apiFetch ← authStore → apiFetch)
    const { useAuthStore } = await import('../stores/authStore');
    const logout = useAuthStore.getState().logout;
    await logout();

    // Redirect to login with reason
    if (typeof window !== 'undefined') {
      window.location.href = '/login?reason=session_expired';
    }
  }

  return response;
}

/**
 * Convenience: apiFetch + JSON parse with error handling
 */
export async function apiFetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(error.message || `HTTP ${res.status}`, res.status);
  }
  return res.json();
}
