export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total?: number;
    page: number;
    limit?: number;
    last_page?: number;
    hasMore: boolean;
  };
}

/**
 * Standardizes the pagination response format for infinite scroll.
 */
export const formatPagination = <T>(
  data: T[],
  page: number,
  limit: number,
  total?: number
): PaginationResult<T> => {
  const hasMore = total !== undefined 
    ? (page * limit) < total 
    : data.length > limit;

  // If we used the limit+1 trick, we remove the extra item
  const resultData = (total === undefined && data.length > limit) 
    ? data.slice(0, limit) 
    : data;

  return {
    data: resultData,
    pagination: {
      total,
      page,
      limit,
      last_page: total ? Math.ceil(total / limit) : undefined,
      hasMore
    }
  };
};
