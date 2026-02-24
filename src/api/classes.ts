import { api } from './client'
import type { Class, PaginatedResponse } from '@/types'

export async function listClasses(seasonId?: string) {
  const { data } = await api.get<Class[]>('/classes', { params: { seasonId } })
  return data
}

export async function getClass(id: string) {
  const { data } = await api.get<Class>(`/classes/${id}`)
  return data
}

export async function createClass(payload: { seasonId: string; name: string; maxStudents: number }) {
  const { data } = await api.post<Class>('/classes', payload)
  return data
}

export async function updateClass(id: string, payload: { name?: string; maxStudents?: number }) {
  const { data } = await api.patch<Class>(`/classes/${id}`, payload)
  return data
}

export async function deleteClass(id: string) {
  await api.delete(`/classes/${id}`)
}

export async function listDeletedClasses(params: { page: number; limit: number }): Promise<PaginatedResponse<Class>> {
  const { data } = await api.get<PaginatedResponse<Class>>('/classes/deleted', { params })
  return data
}

export async function restoreClass(id: string) {
  const { data } = await api.patch<Class>(`/classes/${id}/restore`)
  return data
}

export async function addTeacher(classId: string, teacherId: string) {
  const { data } = await api.post(`/classes/${classId}/teachers/${teacherId}`)
  return data
}

export async function removeTeacher(classId: string, teacherId: string): Promise<void> {
  await api.delete(`/classes/${classId}/teachers/${teacherId}`)
}

export async function addStudent(classId: string, studentId: string) {
  const { data } = await api.post(`/classes/${classId}/students/${studentId}`)
  return data
}

export async function removeStudent(classId: string, studentId: string): Promise<void> {
  await api.delete(`/classes/${classId}/students/${studentId}`)
}

export async function listClassTeachers(classId: string) {
  const { data } = await api.get(`/classes/${classId}/teachers`)
  return data
}

export async function listClassStudents(classId: string) {
  const { data } = await api.get(`/classes/${classId}/students`)
  return data
}
