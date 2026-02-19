import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useSkills } from './useSkills';

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
      category: { id: 'cat-1', name: 'Frontend', color: 'emerald' },
    },
    {
      id: 's2',
      name: 'Node.js',
      description: 'Server runtime',
      level: 'INTERMEDIATE',
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
  });
});
