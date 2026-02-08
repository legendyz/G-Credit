/**
 * badgesApi.test.ts
 * Sprint 7 - Story 9.5: Badge API Client Unit Tests
 *
 * Tests for the badges API client functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAllBadges,
  revokeBadge,
  getBadgeById,
  BadgeStatus,
  RevocationReason,
  REVOCATION_REASONS,
} from './badgesApi';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('badgesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-access-token');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('BadgeStatus constants', () => {
    it('should have correct status values matching Prisma schema', () => {
      expect(BadgeStatus.PENDING).toBe('PENDING');
      expect(BadgeStatus.CLAIMED).toBe('CLAIMED');
      expect(BadgeStatus.REVOKED).toBe('REVOKED');
      expect(BadgeStatus.EXPIRED).toBe('EXPIRED');
    });
  });

  describe('RevocationReason constants', () => {
    it('should have correct reason values matching backend enum', () => {
      expect(RevocationReason.POLICY_VIOLATION).toBe('Policy Violation');
      expect(RevocationReason.ISSUED_IN_ERROR).toBe('Issued in Error');
      expect(RevocationReason.EXPIRED).toBe('Expired');
      expect(RevocationReason.DUPLICATE).toBe('Duplicate');
      expect(RevocationReason.FRAUD).toBe('Fraud');
      expect(RevocationReason.OTHER).toBe('Other');
    });

    it('should have 6 revocation reasons in dropdown list', () => {
      expect(REVOCATION_REASONS).toHaveLength(6);
    });
  });

  describe('getAllBadges', () => {
    const mockBadgesResponse = {
      badges: [
        {
          id: 'badge-1',
          templateId: 'template-1',
          recipientId: 'user-1',
          issuerId: 'issuer-1',
          status: 'PENDING',
          issuedAt: '2026-02-01T00:00:00Z',
          template: { id: 'template-1', name: 'Test Badge', description: 'Test' },
          recipient: { id: 'user-1', email: 'test@example.com' },
          issuer: { id: 'issuer-1', email: 'issuer@example.com' },
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    it('should fetch badges with default params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBadgesResponse),
      });

      const result = await getAllBadges();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/badges/issued?'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-access-token',
          }),
        })
      );
      expect(result).toEqual(mockBadgesResponse);
    });

    it('should include search param when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBadgesResponse),
      });

      await getAllBadges({ search: 'john' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=john'),
        expect.any(Object)
      );
    });

    it('should include status param when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBadgesResponse),
      });

      await getAllBadges({ status: BadgeStatus.CLAIMED });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=CLAIMED'),
        expect.any(Object)
      );
    });

    it('should include activeOnly param when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBadgesResponse),
      });

      await getAllBadges({ activeOnly: true });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('activeOnly=true'),
        expect.any(Object)
      );
    });

    it('should include pagination params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBadgesResponse),
      });

      await getAllBadges({ page: 2, limit: 20 });

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('page=2');
      expect(callUrl).toContain('limit=20');
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      });

      await expect(getAllBadges()).rejects.toThrow('Unauthorized');
    });
  });

  describe('revokeBadge', () => {
    const mockRevokeResponse = {
      success: true,
      message: 'Badge revoked successfully',
      badge: {
        id: 'badge-1',
        status: 'REVOKED',
        revokedAt: '2026-02-01T12:00:00Z',
        revocationReason: 'Policy Violation',
      },
    };

    it('should call revoke endpoint with correct params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRevokeResponse),
      });

      const result = await revokeBadge('badge-1', {
        reason: 'Policy Violation',
        notes: 'Test notes',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/badges/badge-1/revoke'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-access-token',
          }),
          body: JSON.stringify({
            reason: 'Policy Violation',
            notes: 'Test notes',
          }),
        })
      );
      expect(result).toEqual(mockRevokeResponse);
    });

    it('should handle revoke without notes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRevokeResponse),
      });

      await revokeBadge('badge-1', { reason: 'Expired' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ reason: 'Expired' }),
        })
      );
    });

    it('should throw error on revoke failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Badge not found' }),
      });

      await expect(revokeBadge('nonexistent', { reason: 'Other' })).rejects.toThrow(
        'Badge not found'
      );
    });

    it('should throw error on unauthorized revoke', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ message: 'Forbidden' }),
      });

      await expect(revokeBadge('badge-1', { reason: 'Policy Violation' })).rejects.toThrow(
        'Forbidden'
      );
    });
  });

  describe('getBadgeById', () => {
    const mockBadge = {
      id: 'badge-1',
      templateId: 'template-1',
      status: 'CLAIMED',
      issuedAt: '2026-02-01T00:00:00Z',
      template: { id: 'template-1', name: 'Test Badge' },
      recipient: { id: 'user-1', email: 'test@example.com' },
    };

    it('should fetch badge by ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBadge),
      });

      const result = await getBadgeById('badge-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/badges/badge-1'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockBadge);
    });

    it('should throw error if badge not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Badge not found' }),
      });

      await expect(getBadgeById('nonexistent')).rejects.toThrow('Badge not found');
    });
  });

  describe('authentication', () => {
    it('should include auth header when token exists', async () => {
      mockLocalStorage.getItem.mockReturnValue('valid-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ badges: [], total: 0, page: 1, limit: 10, totalPages: 0 }),
      });

      await getAllBadges();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
        })
      );
    });

    it('should not include auth header when no token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ badges: [], total: 0, page: 1, limit: 10, totalPages: 0 }),
      });

      await getAllBadges();

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });
  });
});
