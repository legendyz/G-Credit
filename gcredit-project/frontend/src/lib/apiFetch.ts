import { API_BASE_URL } from './apiConfig';

/**
 * Fetch wrapper that includes credentials (httpOnly cookies) automatically.
 * All API calls should go through this wrapper instead of raw fetch().
 *
 * @see ADR-010: JWT Token Transport Migration
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const { headers: customHeaders, ...rest } = options;

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  const isFormData = options.body instanceof FormData;
  const defaultHeaders: Record<string, string> = isFormData
    ? {}
    : { 'Content-Type': 'application/json' };

  return fetch(url, {
    ...rest,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...customHeaders,
    },
  });
}

/**
 * Convenience: apiFetch + JSON parse with error handling
 */
export async function apiFetchJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  return res.json();
}
