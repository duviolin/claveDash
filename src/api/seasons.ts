import { api } from './client'
import type { Season } from '@/types'

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
}) {
  const { data } = await api.post<Season>('/seasons', payload)
  return data
}

export async function updateSeason(id: string, payload: { name?: string }) {
  const { data } = await api.patch<Season>(`/seasons/${id}`, payload)
  return data
}

export async function deleteSeason(id: string) {
  const { data } = await api.delete(`/seasons/${id}`)
  return data
}
