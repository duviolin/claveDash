import { api } from './client'
import type { School } from '@/types'

interface PaginatedSchools {
  data: School[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export async function listSchools(params?: { page?: number; limit?: number }): Promise<School[]> {
  const { data } = await api.get<PaginatedSchools>('/schools', { params: { page: 1, limit: 100, ...params } })
  return data.data
}

export async function getSchool(id: string) {
  const { data } = await api.get<School>(`/schools/${id}`)
  return data
}

export async function createSchool(payload: { name: string; directorId?: string }) {
  const { data } = await api.post<School>('/schools', payload)
  return data
}

export async function updateSchool(id: string, payload: { name?: string; directorId?: string }) {
  const { data } = await api.patch<School>(`/schools/${id}`, payload)
  return data
}

export async function deleteSchool(id: string) {
  const { data } = await api.delete(`/schools/${id}`)
  return data
}
