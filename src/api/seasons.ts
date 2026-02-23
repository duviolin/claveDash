import { api } from './client'
import type { Season, SeasonStatus, PaginatedResponse } from '@/types'

export async function listDeletedSeasons(params: { page: number; limit: number }): Promise<PaginatedResponse<Season>> {
  const { data } = await api.get<PaginatedResponse<Season>>('/seasons/deleted', { params })
  return data
}

export async function restoreSeason(id: string): Promise<Season> {
  const { data } = await api.patch<Season>(`/seasons/${id}/restore`)
  return data
}

export async function listSeasons(courseId?: string) {
  const { data } = await api.get<Season[]>('/seasons', { params: { courseId } })
  return data
}

export async function listSeasonsPaginated(params: { courseId?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Season>> {
  const { data } = await api.get<PaginatedResponse<Season>>('/seasons', { params })
  return data
}

export async function getSeason(id: string) {
  const { data } = await api.get<Season>(`/seasons/${id}`)
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

export async function updateSeason(id: string, payload: {
  name?: string
  startDate?: string
  endDate?: string
  status?: SeasonStatus
}) {
  const { data } = await api.patch<Season>(`/seasons/${id}`, payload)
  return data
}

export async function deleteSeason(id: string) {
  await api.delete(`/seasons/${id}`)
}
