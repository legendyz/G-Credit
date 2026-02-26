import { describe, it, expect } from 'vitest';
import { queryClient } from '../queryClient';

describe('queryClient — retry configuration', () => {
  it('queries retry is configured as a function', () => {
    const retryOption = queryClient.getDefaultOptions().queries?.retry;
    expect(typeof retryOption).toBe('function');
  });

  it('401 errors are not retried', () => {
    const retryFn = queryClient.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: Error
    ) => boolean;

    const error401 = new Error('HTTP 401');
    expect(retryFn(0, error401)).toBe(false);
    expect(retryFn(1, error401)).toBe(false);
  });

  it('other errors are retried up to 3 times', () => {
    const retryFn = queryClient.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: Error
    ) => boolean;

    const error500 = new Error('Internal Server Error');
    expect(retryFn(0, error500)).toBe(true);
    expect(retryFn(1, error500)).toBe(true);
    expect(retryFn(2, error500)).toBe(true);
    expect(retryFn(3, error500)).toBe(false);
  });
});
