import { api } from './client'
import type { Course, CourseType, PaginatedResponse } from '@/types'

export async function listCourses(schoolId?: string) {
  const { data } = await api.get<Course[]>('/courses', { params: { schoolId } })
  return data
}

export async function listCoursesPaginated(params: { schoolId?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Course>> {
  const { data } = await api.get<PaginatedResponse<Course>>('/courses', { params })
  return data
}

export async function getCourse(id: string) {
  const { data } = await api.get<Course>(`/courses/${id}`)
  return data
}

export async function createCourse(payload: { schoolId: string; name: string; type: CourseType }) {
  const { data } = await api.post<Course>('/courses', payload)
  return data
}

export async function updateCourse(id: string, payload: { name?: string; type?: CourseType }) {
  const { data } = await api.patch<Course>(`/courses/${id}`, payload)
  return data
}

export async function deleteCourse(id: string) {
  const { data } = await api.delete(`/courses/${id}`)
  return data
}
