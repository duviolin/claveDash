import { api } from './client'
import type { Season, SeasonStatus } from '@/types'

export async function listSeasons(courseId?: string) {
  const { data } = await api.get<Season[]>('/seasons', { params: { courseId } })
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
  status?: SeasonStatus
}) {
  const { data } = await api.post<Season>('/seasons', payload)
  return data
}

export async function updateSeason(id: string, payload: Partial<Omit<Season, 'id'>>) {
  const { data } = await api.patch<Season>(`/seasons/${id}`, payload)
  return data
}
