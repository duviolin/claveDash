import { api } from './client'
import type { Class, PaginatedResponse } from '@/types'

export async function listClasses(seasonIdOrSlug?: string) {
  const { data } = await api.get<Class[]>('/classes', { params: { seasonId: seasonIdOrSlug } })
  return data
}

export async function getClass(idOrSlug: string) {
  const { data } = await api.get<Class>(`/classes/${idOrSlug}`)
  return data
}

export async function createClass(payload: { seasonId: string; name: string; maxStudents: number }) {
  const { data } = await api.post<Class>('/classes', payload)
  return data
}

export async function updateClass(idOrSlug: string, payload: { name?: string; maxStudents?: number }) {
  const { data } = await api.patch<Class>(`/classes/${idOrSlug}`, payload)
  return data
}

export async function deleteClass(idOrSlug: string) {
  await api.delete(`/classes/${idOrSlug}`)
}

export async function listDeletedClasses(params: { page: number; limit: number }): Promise<PaginatedResponse<Class>> {
  const { data } = await api.get<PaginatedResponse<Class>>('/classes/deleted', { params })
  return data
}

export async function restoreClass(idOrSlug: string) {
  const { data } = await api.patch<Class>(`/classes/${idOrSlug}/restore`)
  return data
}

export async function addTeacher(classIdOrSlug: string, teacherId: string) {
  const { data } = await api.post(`/classes/${classIdOrSlug}/teachers/${teacherId}`)
  return data
}

export async function removeTeacher(classIdOrSlug: string, teacherId: string): Promise<void> {
  await api.delete(`/classes/${classIdOrSlug}/teachers/${teacherId}`)
}

export async function addStudent(classIdOrSlug: string, studentId: string) {
  const { data } = await api.post(`/classes/${classIdOrSlug}/students/${studentId}`)
  return data
}

export async function removeStudent(classIdOrSlug: string, studentId: string): Promise<void> {
  await api.delete(`/classes/${classIdOrSlug}/students/${studentId}`)
}

export async function listClassTeachers(classIdOrSlug: string) {
  const { data } = await api.get(`/classes/${classIdOrSlug}/teachers`)
  return data
}

export async function listClassStudents(classIdOrSlug: string) {
  const { data } = await api.get(`/classes/${classIdOrSlug}/students`)
  return data
}
