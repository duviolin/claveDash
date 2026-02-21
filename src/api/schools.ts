import { api } from './client'
import type { School } from '@/types'

export async function listSchools() {
  const { data } = await api.get<School[]>('/schools')
  return data
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
