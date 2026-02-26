/**
 * Token Refresh Queue - Story 13.5
 *
 * Ensures only one refresh request is in-flight at a time.
 * Concurrent 401s all await the same Promise.
 */
import { API_BASE_URL } from './apiConfig';

let refreshPromise: Promise<boolean> | null = null;

/**
 * Enqueue a token refresh. If one is already in-flight, piggyback on it.
 * Returns true on success, false on failure.
 */
export function enqueueRefresh(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = doRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Reset queue state (for testing only).
 */
export function _resetRefreshQueue(): void {
  refreshPromise = null;
}
