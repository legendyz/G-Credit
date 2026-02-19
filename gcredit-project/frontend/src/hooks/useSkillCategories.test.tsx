import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useSkillCategoryTree,
  useSkillCategoryFlat,
  useCreateSkillCategory,
  useUpdateSkillCategory,
  useDeleteSkillCategory,
} from './useSkillCategories';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockFetch = vi.fn();

const mockTreeData = [
  {
    id: 'cat-1',
    name: '技术技能',
    level: 1,
    isSystemDefined: true,
    isEditable: true,
    displayOrder: 0,
    children: [
      {
        id: 'cat-1-1',
        name: '前端开发',
        level: 2,
        parentId: 'cat-1',
        isSystemDefined: true,
        isEditable: true,
        displayOrder: 0,
        children: [],
        skills: [{ id: 's1', name: 'React' }],
      },
    ],
    skills: [],
  },
];

const mockFlatData = [
  {
    id: 'cat-1',
    name: '技术技能',
    level: 1,
    isSystemDefined: true,
    isEditable: true,
    displayOrder: 0,
  },
  {
    id: 'cat-1-1',
    name: '前端开发',
    level: 2,
    parentId: 'cat-1',
    isSystemDefined: true,
    isEditable: true,
    displayOrder: 0,
  },
];

describe('useSkillCategoryTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  it('fetches tree data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTreeData),
    });

    const { result } = renderHook(() => useSkillCategoryTree(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTreeData);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/skill-categories?includeSkills=true'),
      expect.any(Object)
    );
  });

  it('handles fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const { result } = renderHook(() => useSkillCategoryTree(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Failed to fetch skill categories');
  });
});

describe('useSkillCategoryFlat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  it('fetches flat list successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFlatData),
    });

    const { result } = renderHook(() => useSkillCategoryFlat(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockFlatData);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/skill-categories/flat'),
      expect.any(Object)
    );
  });
});

describe('useCreateSkillCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  it('creates category and shows success toast', async () => {
    const newCategory = {
      id: 'new-1',
      name: 'New Cat',
      level: 1,
      isSystemDefined: false,
      isEditable: true,
      displayOrder: 0,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(newCategory),
    });

    const { result } = renderHook(() => useCreateSkillCategory(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ name: 'New Cat' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledWith('Category created successfully');
  });

  it('shows error toast on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ message: 'Name is required' }),
    });

    const { result } = renderHook(() => useCreateSkillCategory(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ name: '' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalled();
  });
});

describe('useUpdateSkillCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  it('updates category and shows success toast', async () => {
    const updated = {
      id: 'cat-1',
      name: 'Updated',
      level: 1,
      isSystemDefined: false,
      isEditable: true,
      displayOrder: 0,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(updated),
    });

    const { result } = renderHook(() => useUpdateSkillCategory(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ id: 'cat-1', name: 'Updated' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledWith('Category updated successfully');
  });

  it('shows error toast on update failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: () => Promise.resolve({ message: 'Cannot edit system-defined category' }),
    });

    const { result } = renderHook(() => useUpdateSkillCategory(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ id: 'cat-1', name: 'Bad' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalled();
  });
});

describe('useDeleteSkillCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  it('deletes category and shows success toast', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
    });

    const { result } = renderHook(() => useDeleteSkillCategory(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('cat-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledWith('Category deleted successfully');
  });

  it('shows error toast on delete failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ message: 'Category has skills assigned' }),
    });

    const { result } = renderHook(() => useDeleteSkillCategory(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('cat-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalled();
  });
});
