/**
 * searchFilters Utility Tests - Story 8.2
 */

import { describe, it, expect } from 'vitest';
import {
  filterBadges,
  shouldUseServerSearch,
  hasActiveFilters,
  countActiveFilters,
  filtersToChips,
  type BadgeForFilter,
  type BadgeSearchFilters,
} from './searchFilters';

const createMockBadge = (overrides: Partial<BadgeForFilter> & { 
  name?: string; 
  description?: string; 
  skills?: string[]; 
} = {}): BadgeForFilter => {
  const { name, description, skills, ...rest } = overrides;
  return {
    id: 'badge-1',
    template: {
      id: 'template-1',
      name: name ?? 'Test Badge',
      skillIds: skills ?? ['skill-1', 'skill-2'],
      category: 'General',
    },
    issuer: {
      id: 'issuer-1',
      firstName: 'John',
      lastName: 'Issuer',
      email: 'issuer@example.com',
    },
    recipient: {
      id: 'recipient-1',
      firstName: 'Jane',
      lastName: 'Recipient',
      email: 'recipient@example.com',
    },
    issuedAt: '2025-01-15T10:00:00Z',
    status: 'active',
    ...rest,
  };
};

describe('filterBadges', () => {
  describe('search filter', () => {
    it('filters by badge name (case insensitive)', () => {
      const badges = [
        createMockBadge({ name: 'Leadership Badge' }),
        createMockBadge({ id: '2', name: 'Technical Skills' }),
      ];

      const result = filterBadges(badges, { search: 'leadership' });

      expect(result).toHaveLength(1);
      expect(result[0].template.name).toBe('Leadership Badge');
    });

    it('filters by issuer name', () => {
      const badges = [
        createMockBadge({ issuer: { id: 'i1', firstName: 'Project', lastName: 'Manager', email: 'pm@test.com' } }),
        createMockBadge({ id: '2', issuer: { id: 'i2', firstName: 'Code', lastName: 'Developer', email: 'dev@test.com' } }),
      ];

      const result = filterBadges(badges, { search: 'project' });

      expect(result).toHaveLength(1);
      expect(result[0].issuer.firstName).toBe('Project');
    });

    it('filters by template name', () => {
      const badges = [
        createMockBadge({ 
          template: { id: 't1', name: 'Gold Achievement', skillIds: [] }
        }),
        createMockBadge({ 
          id: '2', 
          template: { id: 't2', name: 'Silver Award', skillIds: [] }
        }),
      ];

      const result = filterBadges(badges, { search: 'gold' });

      expect(result).toHaveLength(1);
      expect(result[0].template.name).toBe('Gold Achievement');
    });

    it('ignores search less than 2 characters', () => {
      const badges = [createMockBadge(), createMockBadge({ id: '2' })];

      const result = filterBadges(badges, { search: 'a' });

      expect(result).toHaveLength(2);
    });
  });

  describe('skills filter', () => {
    it('filters by single skill', () => {
      const badges = [
        createMockBadge({ skills: ['skill-1', 'skill-2'] }),
        createMockBadge({ id: '2', skills: ['skill-3'] }),
      ];

      const result = filterBadges(badges, { skills: ['skill-1'] });

      expect(result).toHaveLength(1);
      expect(result[0].template.skillIds).toContain('skill-1');
    });

    it('filters by any of multiple skills (OR logic)', () => {
      const badges = [
        createMockBadge({ skills: ['skill-1'] }),
        createMockBadge({ id: '2', skills: ['skill-2'] }),
        createMockBadge({ id: '3', skills: ['skill-3'] }),
      ];

      const result = filterBadges(badges, { skills: ['skill-1', 'skill-2'] });

      expect(result).toHaveLength(2);
    });
  });

  describe('date range filter', () => {
    it('filters by from date', () => {
      const badges = [
        createMockBadge({ issuedAt: '2025-01-10T10:00:00Z' }),
        createMockBadge({ id: '2', issuedAt: '2025-01-20T10:00:00Z' }),
      ];

      const result = filterBadges(badges, { fromDate: '2025-01-15' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('filters by to date', () => {
      const badges = [
        createMockBadge({ issuedAt: '2025-01-10T10:00:00Z' }),
        createMockBadge({ id: '2', issuedAt: '2025-01-20T10:00:00Z' }),
      ];

      const result = filterBadges(badges, { toDate: '2025-01-15' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('badge-1');
    });

    it('filters by date range (inclusive)', () => {
      const badges = [
        createMockBadge({ issuedAt: '2025-01-05T10:00:00Z' }),
        createMockBadge({ id: '2', issuedAt: '2025-01-15T10:00:00Z' }),
        createMockBadge({ id: '3', issuedAt: '2025-01-25T10:00:00Z' }),
      ];

      const result = filterBadges(badges, {
        fromDate: '2025-01-10',
        toDate: '2025-01-20',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });
  });

  describe('status filter', () => {
    it('filters by active status', () => {
      const badges = [
        createMockBadge({ status: 'active' }),
        createMockBadge({ id: '2', status: 'revoked' }),
      ];

      const result = filterBadges(badges, { status: 'active' });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('active');
    });

    it('filters by revoked status', () => {
      const badges = [
        createMockBadge({ status: 'active' }),
        createMockBadge({ id: '2', status: 'revoked' }),
      ];

      const result = filterBadges(badges, { status: 'revoked' });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('revoked');
    });
  });

  describe('issuer filter', () => {
    it('filters by issuer ID', () => {
      const badges = [
        createMockBadge({ 
          issuer: { id: 'issuer-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' }
        }),
        createMockBadge({ 
          id: '2', 
          issuer: { id: 'issuer-2', firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' }
        }),
      ];

      const result = filterBadges(badges, { issuerId: 'issuer-1' });

      expect(result).toHaveLength(1);
      expect(result[0].issuer.id).toBe('issuer-1');
    });
  });

  describe('combined filters', () => {
    it('applies all filters together (AND logic)', () => {
      const badges = [
        createMockBadge({
          name: 'Leadership',
          skills: ['skill-1'],
          status: 'active',
          issuedAt: '2025-01-15T10:00:00Z',
        }),
        createMockBadge({
          id: '2',
          name: 'Leadership',
          skills: ['skill-2'],
          status: 'active',
          issuedAt: '2025-01-15T10:00:00Z',
        }),
        createMockBadge({
          id: '3',
          name: 'Technical',
          skills: ['skill-1'],
          status: 'active',
          issuedAt: '2025-01-15T10:00:00Z',
        }),
      ];

      const result = filterBadges(badges, {
        search: 'leadership',
        skills: ['skill-1'],
        status: 'active',
      });

      expect(result).toHaveLength(1);
      expect(result[0].template.name).toBe('Leadership');
      expect(result[0].template.skillIds).toContain('skill-1');
    });
  });
});

describe('shouldUseServerSearch', () => {
  it('returns false for small datasets', () => {
    expect(shouldUseServerSearch(30, 50)).toBe(false);
  });

  it('returns true for large datasets', () => {
    expect(shouldUseServerSearch(60, 50)).toBe(true);
  });

  it('returns true at exact threshold', () => {
    expect(shouldUseServerSearch(50, 50)).toBe(true);
  });
});

describe('hasActiveFilters', () => {
  it('returns false for empty filters', () => {
    expect(hasActiveFilters({})).toBe(false);
  });

  it('returns false for all default values', () => {
    expect(
      hasActiveFilters({
        search: '',
        skills: undefined,
        fromDate: null,
        toDate: null,
        status: undefined,
      })
    ).toBe(false);
  });

  it('returns true for search filter', () => {
    expect(hasActiveFilters({ search: 'test' })).toBe(true);
  });

  it('returns true for skills filter', () => {
    expect(hasActiveFilters({ skills: ['skill-1'] })).toBe(true);
  });

  it('returns true for date filter', () => {
    expect(hasActiveFilters({ fromDate: '2025-01-01' })).toBe(true);
    expect(hasActiveFilters({ toDate: '2025-01-31' })).toBe(true);
  });

  it('returns true for status filter', () => {
    expect(hasActiveFilters({ status: 'active' })).toBe(true);
  });
});

describe('countActiveFilters', () => {
  it('returns 0 for no filters', () => {
    expect(countActiveFilters({})).toBe(0);
  });

  it('counts each filter type once', () => {
    expect(
      countActiveFilters({
        search: 'test',
        skills: ['skill-1', 'skill-2'],
        status: 'active',
      })
    ).toBe(3);
  });

  it('counts date range as one filter', () => {
    expect(
      countActiveFilters({
        fromDate: '2025-01-01',
        toDate: '2025-01-31',
      })
    ).toBe(1);
  });
});

describe('filtersToChips', () => {
  it('returns empty array for no filters', () => {
    expect(filtersToChips({})).toEqual([]);
  });

  it('creates chip for search filter', () => {
    const chips = filtersToChips({ search: 'leadership' });

    expect(chips).toHaveLength(1);
    expect(chips[0]).toMatchObject({
      id: 'search',
      label: expect.stringContaining('leadership'),
    });
  });

  it('creates chip for skills filter with names', () => {
    const chips = filtersToChips(
      { skills: ['skill-1', 'skill-2'] },
      { skillNames: { 'skill-1': 'Leadership', 'skill-2': 'Management' } }
    );

    expect(chips).toHaveLength(1);
    expect(chips[0].label).toContain('Leadership');
    expect(chips[0].label).toContain('Management');
  });

  it('creates chip for date range', () => {
    const chips = filtersToChips({
      fromDate: '2025-01-01',
      toDate: '2025-01-31',
    });

    expect(chips).toHaveLength(1);
    expect(chips[0].id).toBe('dateRange');
  });

  it('creates chip for status filter', () => {
    const chips = filtersToChips({ status: 'active' });

    expect(chips).toHaveLength(1);
    expect(chips[0]).toMatchObject({
      id: 'status',
      label: expect.stringContaining('Active'),
    });
  });

  it('creates chip for issuer filter with name', () => {
    const chips = filtersToChips(
      { issuerId: 'issuer-1' },
      { issuerNames: { 'issuer-1': 'John Doe' } }
    );

    expect(chips).toHaveLength(1);
    expect(chips[0].label).toContain('John Doe');
  });
});
