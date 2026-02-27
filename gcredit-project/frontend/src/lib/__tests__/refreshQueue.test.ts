import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { enqueueRefresh, _resetRefreshQueue } from '../refreshQueue';

// Mock apiConfig to avoid import.meta.env issues
vi.mock('../apiConfig', () => ({
  API_BASE_URL: 'http://localhost:3000/api',
}));

describe('refreshQueue', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    _resetRefreshQueue();
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('single refresh call → POST /auth/refresh', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const result = await enqueueRefresh();

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('concurrent calls → only 1 fetch', async () => {
    // Use a deferred promise to control timing
    let resolveRefresh!: (value: Response) => void;
    mockFetch.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveRefresh = resolve;
      })
    );

    // Fire 5 concurrent refresh requests
    const promises = Array.from({ length: 5 }, () => enqueueRefresh());

    // Resolve the single in-flight fetch
    resolveRefresh({ ok: true } as Response);

    const results = await Promise.all(promises);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    results.forEach((r) => expect(r).toBe(true));
  });

  it('refresh failure → returns false', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    const result = await enqueueRefresh();

    expect(result).toBe(false);
  });

  it('network error → returns false', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await enqueueRefresh();

    expect(result).toBe(false);
  });

  it('after failure, next call creates new refresh', async () => {
    // First call fails
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
    const first = await enqueueRefresh();
    expect(first).toBe(false);

    // Second call succeeds — should create a NEW fetch
    mockFetch.mockResolvedValueOnce({ ok: true });
    const second = await enqueueRefresh();
    expect(second).toBe(true);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
