import { api } from './client'
import type { PaginatedResponse, School } from '@/types'

export async function listSchools(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<School>> {
  const { data } = await api.get<PaginatedResponse<School>>('/schools', { params })
  return data
}

export async function getSchool(idOrSlug: string) {
  const { data } = await api.get<School>(`/schools/${idOrSlug}`)
  return data
}

export async function createSchool(payload: { name: string; directorId?: string }) {
  const { data } = await api.post<School>('/schools', payload)
  return data
}

export async function updateSchool(idOrSlug: string, payload: { name?: string; directorId?: string }) {
  const { data } = await api.patch<School>(`/schools/${idOrSlug}`, payload)
  return data
}

export async function deleteSchool(idOrSlug: string) {
  await api.delete(`/schools/${idOrSlug}`)
}

export async function listDeletedSchools(params: { page: number; limit: number }) {
  const { data } = await api.get<PaginatedResponse<School>>('/schools/deleted', { params })
  return data
}

export async function restoreSchool(idOrSlug: string) {
  const { data } = await api.patch<School>(`/schools/${idOrSlug}/restore`)
  return data
}
