/**
 * useBadgeSearch Hook Tests - Story 8.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBadgeSearch } from './useBadgeSearch';
import type { BadgeForFilter } from '@/utils/searchFilters';

// Mock badges
const createMockBadges = (count: number): BadgeForFilter[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `badge-${i + 1}`,
    issuedAt: new Date(2025, 0, i + 1).toISOString(),
    status: i % 2 === 0 ? 'active' : 'revoked',
    template: {
      id: `template-${i + 1}`,
      name: `Badge ${i + 1}`,
      skillIds: i % 3 === 0 ? ['skill-1', 'skill-2'] : ['skill-3'],
    },
    issuer: {
      id: `issuer-${(i % 3) + 1}`,
      firstName: `Issuer`,
      lastName: `${i + 1}`,
      email: `issuer${i + 1}@example.com`,
    },
  }));
};

describe('useBadgeSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useBadgeSearch({ allBadges: [] }));

      expect(result.current.searchTerm).toBe('');
      expect(result.current.selectedSkills).toEqual([]);
      expect(result.current.dateRange).toEqual({ from: null, to: null });
      expect(result.current.statusFilter).toBe('all');
      expect(result.current.hasFilters).toBe(false);
      expect(result.current.filterCount).toBe(0);
    });

    it('returns all badges when no filters applied', () => {
      const mockBadges = createMockBadges(10);
      const { result } = renderHook(() => useBadgeSearch({ allBadges: mockBadges }));

      expect(result.current.filteredBadges).toHaveLength(10);
    });
  });

  describe('search term', () => {
    it('debounces search term', async () => {
      const mockBadges = createMockBadges(10);
      const { result } = renderHook(() =>
        useBadgeSearch({ allBadges: mockBadges, debounceDelay: 500 })
      );

      act(() => {
        result.current.setSearchTerm('Badge 1');
      });

      // Immediate: searchTerm updated, debouncedSearchTerm not yet
      expect(result.current.searchTerm).toBe('Badge 1');
      expect(result.current.debouncedSearchTerm).toBe('');

      // After debounce delay - need to wrap timer advance in act
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.debouncedSearchTerm).toBe('Badge 1');
    });

    it('filters badges by search term (client-side)', async () => {
      const mockBadges = createMockBadges(10);
      const { result } = renderHook(() =>
        useBadgeSearch({ allBadges: mockBadges, debounceDelay: 300 })
      );

      act(() => {
        result.current.setSearchTerm('Badge 1');
      });

      // Advance timers with act to allow state updates
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Should match Badge 1, Badge 10
      expect(result.current.filteredBadges.length).toBeLessThan(10);
      expect(result.current.filteredBadges.some((b) => b.template.name === 'Badge 1')).toBe(true);
    });
  });

  describe('skill filter', () => {
    it('filters badges by selected skills', async () => {
      const mockBadges = createMockBadges(10);
      const { result } = renderHook(() => useBadgeSearch({ allBadges: mockBadges }));

      act(() => {
        result.current.setSelectedSkills(['skill-1']);
      });

      // Badges with skill-1 (indices 0, 3, 6, 9 - every 3rd)
      expect(result.current.filteredBadges.length).toBeGreaterThan(0);
      result.current.filteredBadges.forEach((badge) => {
        expect(badge.template.skillIds).toContain('skill-1');
      });
    });

    it('updates filter count when skills selected', () => {
      const mockBadges = createMockBadges(10);
      const { result } = renderHook(() => useBadgeSearch({ allBadges: mockBadges }));

      expect(result.current.filterCount).toBe(0);

      act(() => {
        result.current.setSelectedSkills(['skill-1', 'skill-2']);
      });

      expect(result.current.filterCount).toBe(1); // Skills count as 1 filter
      expect(result.current.hasFilters).toBe(true);
    });
  });

  describe('date range filter', () => {
    it('filters badges by date range', () => {
      const mockBadges = createMockBadges(30);
      const { result } = renderHook(() => useBadgeSearch({ allBadges: mockBadges }));

      act(() => {
        result.current.setDateRange({
          from: '2025-01-05',
          to: '2025-01-10',
        });
      });

      // Should only include badges issued between Jan 5-10
      expect(result.current.filteredBadges.length).toBeLessThan(30);
      result.current.filteredBadges.forEach((badge) => {
        const date = new Date(badge.issuedAt);
        expect(date.getDate()).toBeGreaterThanOrEqual(5);
        expect(date.getDate()).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('status filter', () => {
    it('filters badges by status', () => {
      const mockBadges = createMockBadges(10);
      const { result } = renderHook(() => useBadgeSearch({ allBadges: mockBadges }));

      act(() => {
        result.current.setStatusFilter('active');
      });

      result.current.filteredBadges.forEach((badge) => {
        expect(badge.status).toBe('active');
      });
    });
  });

  describe('clear filters', () => {
    it('clears all filters', () => {
      const mockBadges = createMockBadges(10);
      const { result } = renderHook(() => useBadgeSearch({ allBadges: mockBadges }));

      // Set multiple filters
      act(() => {
        result.current.setSearchTerm('test');
        result.current.setSelectedSkills(['skill-1']);
        result.current.setDateRange({ from: '2025-01-01', to: '2025-01-10' });
        result.current.setStatusFilter('active');
      });

      expect(result.current.hasFilters).toBe(true);

      // Clear all
      act(() => {
        result.current.clearAllFilters();
      });

      expect(result.current.searchTerm).toBe('');
      expect(result.current.selectedSkills).toEqual([]);
      expect(result.current.dateRange).toEqual({ from: null, to: null });
      expect(result.current.statusFilter).toBe('all');
      expect(result.current.hasFilters).toBe(false);
    });

    it('removes individual filter by chip id', () => {
      const mockBadges = createMockBadges(10);
      const { result } = renderHook(() => useBadgeSearch({ allBadges: mockBadges }));

      act(() => {
        result.current.setSelectedSkills(['skill-1']);
        result.current.setStatusFilter('active');
      });

      expect(result.current.filterCount).toBe(2);

      act(() => {
        result.current.removeFilter('skills');
      });

      expect(result.current.selectedSkills).toEqual([]);
      expect(result.current.statusFilter).toBe('active');
      expect(result.current.filterCount).toBe(1);
    });
  });

  describe('filter chips', () => {
    it('generates filter chips from active filters', () => {
      const mockBadges = createMockBadges(10);
      const skillNames = { 'skill-1': 'Leadership' };

      const { result } = renderHook(() =>
        useBadgeSearch({
          allBadges: mockBadges,
          skillNames,
        })
      );

      act(() => {
        result.current.setSelectedSkills(['skill-1']);
        result.current.setStatusFilter('active');
      });

      expect(result.current.filterChips.length).toBe(2);
      expect(result.current.filterChips.find((c) => c.id === 'skills')).toBeDefined();
      expect(result.current.filterChips.find((c) => c.id === 'status')).toBeDefined();
    });
  });

  describe('server vs client search', () => {
    it('uses client-side search for small datasets (<50)', () => {
      const mockBadges = createMockBadges(30);
      const { result } = renderHook(() =>
        useBadgeSearch({
          allBadges: mockBadges,
          serverSearchThreshold: 50,
        })
      );

      expect(result.current.isServerSearch).toBe(false);
    });

    it('uses server-side search for large datasets (>=50)', () => {
      const mockBadges = createMockBadges(60);
      const { result } = renderHook(() =>
        useBadgeSearch({
          allBadges: mockBadges,
          totalCount: 60,
          serverSearchThreshold: 50,
        })
      );

      expect(result.current.isServerSearch).toBe(true);
    });

    it('respects custom threshold', () => {
      const mockBadges = createMockBadges(25);
      const { result } = renderHook(() =>
        useBadgeSearch({
          allBadges: mockBadges,
          serverSearchThreshold: 20,
        })
      );

      expect(result.current.isServerSearch).toBe(true);
    });
  });

  describe('combined filters', () => {
    it('applies multiple filters simultaneously', async () => {
      const mockBadges = createMockBadges(30);
      const { result } = renderHook(() => useBadgeSearch({ allBadges: mockBadges }));

      act(() => {
        result.current.setSelectedSkills(['skill-1']);
        result.current.setStatusFilter('active');
        result.current.setDateRange({ from: '2025-01-01', to: '2025-01-15' });
      });

      // All filtered badges should match all criteria
      result.current.filteredBadges.forEach((badge) => {
        expect(badge.template.skillIds).toContain('skill-1');
        expect(badge.status).toBe('active');
        const date = new Date(badge.issuedAt);
        expect(date.getDate()).toBeLessThanOrEqual(15);
      });
    });
  });
});
