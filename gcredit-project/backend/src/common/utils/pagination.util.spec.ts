import { createPaginatedResponse } from './pagination.util';

describe('createPaginatedResponse', () => {
  it('should return correct structure for normal pagination', () => {
    const result = createPaginatedResponse(['a', 'b', 'c'], 25, 2, 10);

    expect(result).toEqual({
      data: ['a', 'b', 'c'],
      meta: {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      },
    });
  });

  it('should set hasPreviousPage=false for page 1', () => {
    const result = createPaginatedResponse(['a'], 10, 1, 5);
    expect(result.meta.hasPreviousPage).toBe(false);
    expect(result.meta.hasNextPage).toBe(true);
  });

  it('should set hasNextPage=false for last page', () => {
    const result = createPaginatedResponse(['a'], 10, 2, 5);
    expect(result.meta.hasNextPage).toBe(false);
    expect(result.meta.hasPreviousPage).toBe(true);
  });

  it('should handle total=0', () => {
    const result = createPaginatedResponse([], 0, 1, 10);

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
    expect(result.meta.totalPages).toBe(0);
    expect(result.meta.hasNextPage).toBe(false);
    expect(result.meta.hasPreviousPage).toBe(false);
  });

  it('should ceil totalPages upward', () => {
    const result = createPaginatedResponse(['a'], 11, 1, 5);
    expect(result.meta.totalPages).toBe(3); // ceil(11/5) = 3
  });

  it('should handle single page exactly', () => {
    const result = createPaginatedResponse(['a', 'b'], 2, 1, 10);
    expect(result.meta.totalPages).toBe(1);
    expect(result.meta.hasNextPage).toBe(false);
    expect(result.meta.hasPreviousPage).toBe(false);
  });

  it('should handle limit=0 gracefully', () => {
    const result = createPaginatedResponse([], 10, 1, 0);
    expect(result.meta.totalPages).toBe(0);
  });
});
