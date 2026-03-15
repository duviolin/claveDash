import type { PaginatedResponse } from '@/types'

export const API_MAX_PAGE_LIMIT = 100

interface FetchAllPaginatedParams {
  page: number
  limit: number
}

export async function fetchAllPaginated<T>(
  fetchPage: (params: FetchAllPaginatedParams) => Promise<PaginatedResponse<T>>
): Promise<T[]> {
  const allItems: T[] = []
  let page = 1
  let totalPages = 1

  do {
    const response = await fetchPage({ page, limit: API_MAX_PAGE_LIMIT })
    allItems.push(...response.data)
    totalPages = response.pagination.totalPages
    page += 1
  } while (page <= totalPages)

  return allItems
}
