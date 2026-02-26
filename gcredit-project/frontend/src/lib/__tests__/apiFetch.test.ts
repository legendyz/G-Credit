import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock refreshQueue before importing apiFetch
vi.mock('../refreshQueue', () => ({
  enqueueRefresh: vi.fn(),
}));

// Mock authStore dynamic import
const mockLogout = vi.fn().mockResolvedValue(undefined);
vi.mock('../../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ logout: mockLogout }),
  },
}));

// Mock apiConfig
vi.mock('../apiConfig', () => ({
  API_BASE_URL: 'http://localhost:3000/api',
}));

import { apiFetch, apiFetchJson, ApiError } from '../apiFetch';
import { enqueueRefresh } from '../refreshQueue';

describe('apiFetch — 401 interceptor', () => {
  const mockFetch = vi.fn();
  const originalLocation = window.location;

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    mockLogout.mockClear();
    vi.mocked(enqueueRefresh).mockReset();

    // Mock window.location for redirect assertions
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '' },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('returns response normally on 200', async () => {
    const okResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
    mockFetch.mockResolvedValueOnce(okResponse);

    const result = await apiFetch('/users');

    expect(result.status).toBe(200);
    expect(enqueueRefresh).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns response normally on 404', async () => {
    const notFoundResponse = new Response('Not Found', { status: 404 });
    mockFetch.mockResolvedValueOnce(notFoundResponse);

    const result = await apiFetch('/users/999');

    expect(result.status).toBe(404);
    expect(enqueueRefresh).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('single 401 → refresh success → retries original request', async () => {
    const unauthorizedResponse = new Response('Unauthorized', { status: 401 });
    const retryResponse = new Response(JSON.stringify({ data: 'ok' }), { status: 200 });

    // First call → 401, second call (retry) → 200
    mockFetch.mockResolvedValueOnce(unauthorizedResponse).mockResolvedValueOnce(retryResponse);
    vi.mocked(enqueueRefresh).mockResolvedValueOnce(true);

    const result = await apiFetch('/users');

    expect(result.status).toBe(200);
    expect(enqueueRefresh).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('single 401 → refresh failure → calls logout + redirects', async () => {
    const unauthorizedResponse = new Response('Unauthorized', { status: 401 });
    mockFetch.mockResolvedValueOnce(unauthorizedResponse);
    vi.mocked(enqueueRefresh).mockResolvedValueOnce(false);

    const result = await apiFetch('/users');

    expect(result.status).toBe(401);
    expect(enqueueRefresh).toHaveBeenCalledTimes(1);
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('/login?reason=session_expired');
  });

  it('retried request gets 401 → no infinite loop', async () => {
    const unauthorizedResponse = new Response('Unauthorized', { status: 401 });
    mockFetch.mockResolvedValueOnce(unauthorizedResponse);

    // Pass _retried: true to simulate a retry that also gets 401
    const result = await apiFetch('/users', { _retried: true });

    expect(result.status).toBe(401);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(enqueueRefresh).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('excluded path /auth/refresh → 401 returned as-is', async () => {
    const unauthorizedResponse = new Response('Unauthorized', { status: 401 });
    mockFetch.mockResolvedValueOnce(unauthorizedResponse);

    const result = await apiFetch('/auth/refresh', { method: 'POST' });

    expect(result.status).toBe(401);
    expect(enqueueRefresh).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('excluded path /auth/logout → 401 returned as-is', async () => {
    const unauthorizedResponse = new Response('Unauthorized', { status: 401 });
    mockFetch.mockResolvedValueOnce(unauthorizedResponse);

    const result = await apiFetch('/auth/logout', { method: 'POST' });

    expect(result.status).toBe(401);
    expect(enqueueRefresh).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('POST retry preserves method, body, and headers', async () => {
    const unauthorizedResponse = new Response('Unauthorized', { status: 401 });
    const retryResponse = new Response(JSON.stringify({ id: 1 }), { status: 201 });

    mockFetch.mockResolvedValueOnce(unauthorizedResponse).mockResolvedValueOnce(retryResponse);
    vi.mocked(enqueueRefresh).mockResolvedValueOnce(true);

    const body = JSON.stringify({ name: 'test' });
    const result = await apiFetch('/users', {
      method: 'POST',
      body,
      headers: { 'X-Custom': 'value' },
    });

    expect(result.status).toBe(201);
    // Verify the retried fetch preserved original request shape
    const retryCall = mockFetch.mock.calls[1];
    const retryUrl = retryCall[0] as string;
    const retryInit = retryCall[1] as RequestInit;
    expect(retryUrl).toContain('/users');
    expect(retryInit.method).toBe('POST');
    expect(retryInit.body).toBe(body);
    expect((retryInit.headers as Record<string, string>)['X-Custom']).toBe('value');
  });

  it('apiFetchJson inherits 401 interceptor (refresh → retry → parse)', async () => {
    const unauthorizedResponse = new Response('Unauthorized', { status: 401 });
    const retryResponse = new Response(JSON.stringify({ message: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    mockFetch.mockResolvedValueOnce(unauthorizedResponse).mockResolvedValueOnce(retryResponse);
    vi.mocked(enqueueRefresh).mockResolvedValueOnce(true);

    const data = await apiFetchJson<{ message: string }>('/users');

    expect(data).toEqual({ message: 'ok' });
    expect(enqueueRefresh).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('apiFetchJson throws ApiError with status on non-ok response', async () => {
    const errorResponse = new Response(JSON.stringify({ message: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
    mockFetch.mockResolvedValueOnce(errorResponse);

    const err = await apiFetchJson('/admin').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(403);
    expect((err as ApiError).message).toBe('Forbidden');
  });
});
