import { api } from './client'
import type { Season, SeasonStatus, PaginatedResponse } from '@/types'

export async function listDeletedSeasons(params: { page: number; limit: number }): Promise<PaginatedResponse<Season>> {
  const { data } = await api.get<PaginatedResponse<Season>>('/seasons/deleted', { params })
  return data
}

export async function restoreSeason(idOrSlug: string): Promise<Season> {
  const { data } = await api.patch<Season>(`/seasons/${idOrSlug}/restore`)
  return data
}

export async function listSeasons(courseIdOrSlug?: string) {
  const { data } = await api.get<Season[]>('/seasons', { params: { courseId: courseIdOrSlug } })
  return data
}

export async function listSeasonsPaginated(params: { courseId?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Season>> {
  const { data } = await api.get<PaginatedResponse<Season>>('/seasons', { params })
  return data
}

export async function getSeason(idOrSlug: string) {
  const { data } = await api.get<Season>(`/seasons/${idOrSlug}`)
  return data
}

export async function createSeason(payload: {
  courseId: string
  name: string
  startDate: string
  endDate: string
}) {
  const { data } = await api.post<Season>('/seasons', payload)
  return data
}

export async function updateSeason(idOrSlug: string, payload: {
  name?: string
  startDate?: string
  endDate?: string
  status?: SeasonStatus
}) {
  const { data } = await api.patch<Season>(`/seasons/${idOrSlug}`, payload)
  return data
}

export async function deleteSeason(idOrSlug: string) {
  await api.delete(`/seasons/${idOrSlug}`)
}
