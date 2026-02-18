import { PaginatedResponse } from '../interfaces/paginated-response.interface';

/**
 * Create a standardized paginated response.
 *
 * @param data  - Array of items for the current page
 * @param total - Total number of items across all pages
 * @param page  - Current page number (1-based)
 * @param limit - Items per page
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
