import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCreateSkill, useUpdateSkill, useDeleteSkill } from './useSkillMutations';

// Mock apiFetchJson
const mockApiFetchJson = vi.fn();
vi.mock('@/lib/apiFetch', () => ({
  apiFetchJson: (...args: unknown[]) => mockApiFetchJson(...args),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useSkillMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetchJson.mockResolvedValue({});
  });

  describe('useCreateSkill', () => {
    it('calls POST /skills with correct payload', async () => {
      const { result } = renderHook(() => useCreateSkill(), { wrapper: createWrapper() });
      const input = { name: 'React', categoryId: 'cat-1', description: 'Frontend framework' };

      result.current.mutate(input);

      await waitFor(() => expect(mockApiFetchJson).toHaveBeenCalledTimes(1));
      expect(mockApiFetchJson).toHaveBeenCalledWith(
        '/skills',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(input),
        })
      );
    });

    it('handles create error', async () => {
      mockApiFetchJson.mockRejectedValueOnce(new Error('Duplicate skill'));
      const { result } = renderHook(() => useCreateSkill(), { wrapper: createWrapper() });

      result.current.mutate({ name: 'React', categoryId: 'cat-1' });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useUpdateSkill', () => {
    it('calls PATCH /skills/:id with correct payload', async () => {
      const { result } = renderHook(() => useUpdateSkill(), { wrapper: createWrapper() });

      result.current.mutate({ id: 's1', name: 'React.js', level: 'ADVANCED' });

      await waitFor(() => expect(mockApiFetchJson).toHaveBeenCalledTimes(1));
      expect(mockApiFetchJson).toHaveBeenCalledWith(
        '/skills/s1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ name: 'React.js', level: 'ADVANCED' }),
        })
      );
    });

    it('handles update error', async () => {
      mockApiFetchJson.mockRejectedValueOnce(new Error('Not found'));
      const { result } = renderHook(() => useUpdateSkill(), { wrapper: createWrapper() });

      result.current.mutate({ id: 's1', name: 'React.js' });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useDeleteSkill', () => {
    it('calls DELETE /skills/:id', async () => {
      const { result } = renderHook(() => useDeleteSkill(), { wrapper: createWrapper() });

      result.current.mutate('s1');

      await waitFor(() => expect(mockApiFetchJson).toHaveBeenCalledTimes(1));
      expect(mockApiFetchJson).toHaveBeenCalledWith(
        '/skills/s1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('handles delete error (referenced by templates)', async () => {
      mockApiFetchJson.mockRejectedValueOnce(new Error('referenced by 2 badge template(s)'));
      const { result } = renderHook(() => useDeleteSkill(), { wrapper: createWrapper() });

      result.current.mutate('s1');

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
