import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useSkills, useSkillNamesMap } from './useSkills';

// Mock apiFetch
const mockApiFetch = vi.fn();
vi.mock('@/lib/apiFetch', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useSkills', () => {
  const mockApiData = [
    {
      id: 's1',
      name: 'React',
      description: 'Frontend framework',
      level: 'ADVANCED',
      badgeCount: 2,
      category: { id: 'cat-1', name: 'Frontend', color: 'emerald' },
    },
    {
      id: 's2',
      name: 'Node.js',
      description: 'Server runtime',
      level: 'INTERMEDIATE',
      badgeCount: 0,
      category: { id: 'cat-2', name: 'Backend', color: 'blue' },
    },
    {
      id: 's3',
      name: 'Uncategorized',
      description: null,
      level: null,
      category: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiData),
    });
  });

  it('maps categoryName correctly (bug fix: was "category")', async () => {
    const { result } = renderHook(() => useSkills(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toBeDefined());

    const skills = result.current.data!;
    expect(skills[0].categoryName).toBe('Frontend');
    expect(skills[1].categoryName).toBe('Backend');
    expect(skills[2].categoryName).toBeUndefined();
    // Ensure old broken field does not exist
    expect((skills[0] as Record<string, unknown>).category).toBeUndefined();
  });

  it('includes categoryColor from category.color', async () => {
    const { result } = renderHook(() => useSkills(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toBeDefined());

    const skills = result.current.data!;
    expect(skills[0].categoryColor).toBe('emerald');
    expect(skills[1].categoryColor).toBe('blue');
    expect(skills[2].categoryColor).toBeUndefined();
  });

  it('includes categoryId, description, and level fields', async () => {
    const { result } = renderHook(() => useSkills(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toBeDefined());

    const skills = result.current.data!;
    expect(skills[0].categoryId).toBe('cat-1');
    expect(skills[0].description).toBe('Frontend framework');
    expect(skills[0].level).toBe('ADVANCED');
    expect(skills[0].badgeCount).toBe(2);
    expect(skills[1].badgeCount).toBe(0);
    expect(skills[2].badgeCount).toBe(0); // undefined from API → defaults to 0
  });
});

describe('useSkillNamesMap', () => {
  const mockApiData = [
    {
      id: 's1',
      name: 'React',
      category: { id: 'cat-1', name: 'Frontend', color: 'emerald' },
    },
    {
      id: 's2',
      name: 'Node.js',
      category: { id: 'cat-2', name: 'Backend', color: 'blue' },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns resolved names for known IDs', async () => {
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiData),
    });

    const { result } = renderHook(() => useSkillNamesMap(['s1', 's2']), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current['s1']).toBe('React'));
    expect(result.current['s2']).toBe('Node.js');
  });

  it('returns "Unknown Skill" for IDs not found in skills list', async () => {
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiData),
    });

    const { result } = renderHook(() => useSkillNamesMap(['s1', 'deleted-uuid']), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current['s1']).toBe('React'));
    expect(result.current['deleted-uuid']).toBe('Unknown Skill');
  });

  it('returns "Unknown Skill" for all IDs when skills not yet loaded', () => {
    // Never resolve the fetch — skills stay undefined
    mockApiFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useSkillNamesMap(['s1', 's2']), {
      wrapper: createWrapper(),
    });

    // Before skills load, all entries should be "Unknown Skill"
    expect(result.current['s1']).toBe('Unknown Skill');
    expect(result.current['s2']).toBe('Unknown Skill');
  });

  it('returns empty object when skillIds is undefined', async () => {
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiData),
    });

    const { result } = renderHook(() => useSkillNamesMap(undefined), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current).toEqual({}));
  });
});
