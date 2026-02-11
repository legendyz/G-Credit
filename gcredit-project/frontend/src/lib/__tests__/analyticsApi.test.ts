/**
 * Analytics API Client Tests - Story 10.5
 *
 * Tests for the 5 analytics API functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getSystemOverview,
  getIssuanceTrends,
  getTopPerformers,
  getSkillsDistribution,
  getRecentActivity,
} from '../analyticsApi';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('analyticsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('test-access-token');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ─── getSystemOverview ─────────────────────────────────────────────

  describe('getSystemOverview', () => {
    const mockResponse = {
      users: { total: 100, activeThisMonth: 50, newThisMonth: 5, byRole: {} },
      badges: {
        totalIssued: 200,
        claimedCount: 150,
        pendingCount: 40,
        revokedCount: 10,
        claimRate: 0.75,
      },
      badgeTemplates: { total: 20, active: 15, draft: 3, archived: 2 },
      systemHealth: {
        status: 'healthy',
        lastSync: '2026-02-09T00:00:00Z',
        apiResponseTime: '120ms',
      },
    };

    it('calls the correct URL with auth headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await getSystemOverview();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/system-overview'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('returns parsed response data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getSystemOverview();
      expect(result).toEqual(mockResponse);
    });

    it('throws on HTTP error with message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ message: 'Insufficient permissions' }),
      });

      await expect(getSystemOverview()).rejects.toThrow('Insufficient permissions');
    });

    it('throws generic error when response has no message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('parse error')),
      });

      await expect(getSystemOverview()).rejects.toThrow('Request failed');
    });
  });

  // ─── getIssuanceTrends ─────────────────────────────────────────────

  describe('getIssuanceTrends', () => {
    const mockResponse = {
      period: 'last30days',
      startDate: '2026-01-10',
      endDate: '2026-02-09',
      dataPoints: [],
      totals: { issued: 10, claimed: 8, revoked: 1, claimRate: 0.8 },
    };

    it('includes period query param', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await getIssuanceTrends(90);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/issuance-trends\?period=90/),
        expect.any(Object)
      );
    });

    it('defaults to period=30', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await getIssuanceTrends();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/issuance-trends\?period=30/),
        expect.any(Object)
      );
    });

    it('returns parsed data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getIssuanceTrends(30);
      expect(result).toEqual(mockResponse);
    });
  });

  // ─── getTopPerformers ──────────────────────────────────────────────

  describe('getTopPerformers', () => {
    const mockResponse = {
      period: 'allTime',
      topPerformers: [{ userId: 'u1', name: 'Alice', badgeCount: 5 }],
    };

    it('includes limit query param', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await getTopPerformers(5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/top-performers\?limit=5/),
        expect.any(Object)
      );
    });

    it('defaults to limit=10', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await getTopPerformers();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/top-performers\?limit=10/),
        expect.any(Object)
      );
    });
  });

  // ─── getSkillsDistribution ────────────────────────────────────────

  describe('getSkillsDistribution', () => {
    const mockResponse = {
      totalSkills: 15,
      topSkills: [],
      skillsByCategory: { Technical: 10, Leadership: 5 },
    };

    it('calls the correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await getSkillsDistribution();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/skills-distribution'),
        expect.any(Object)
      );
    });

    it('returns parsed data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getSkillsDistribution();
      expect(result).toEqual(mockResponse);
    });
  });

  // ─── getRecentActivity ────────────────────────────────────────────

  describe('getRecentActivity', () => {
    const mockResponse = {
      activities: [],
      pagination: { limit: 10, offset: 0, total: 0 },
    };

    it('includes limit and offset query params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await getRecentActivity(20, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/recent-activity\?limit=20&offset=5/),
        expect.any(Object)
      );
    });

    it('defaults to limit=10, offset=0', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await getRecentActivity();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/recent-activity\?limit=10&offset=0/),
        expect.any(Object)
      );
    });
  });

  // ─── Auth header behavior ─────────────────────────────────────────

  describe('auth headers', () => {
    it('sends request without Authorization when no token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await getSystemOverview();

      const calledHeaders = mockFetch.mock.calls[0][1].headers;
      expect(calledHeaders.Authorization).toBeUndefined();
      expect(calledHeaders['Content-Type']).toBe('application/json');
    });
  });
});
