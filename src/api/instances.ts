import { api } from './client'
import type { PaginatedResponse, Project } from '@/types'

interface ListProjectInstancesParams {
  page: number
  limit: number
  seasonId?: string
  classId?: string
  templateId?: string
}

export async function listProjectInstancesPaginated(params: ListProjectInstancesParams) {
  const { data } = await api.get<PaginatedResponse<Project>>('/project-instances', { params })
  return data
}

export async function listDeletedProjectInstances(params: { page: number; limit: number }) {
  const { data } = await api.get<PaginatedResponse<Project>>('/project-instances/deleted', { params })
  return data
}

export async function instantiateProject(payload: {
  templateId: string
  classId: string
  seasonId: string
}): Promise<Project> {
  const { data } = await api.post<Project>('/project-instances', payload)
  return data
}

/** Lista projetos do semestre. Endpoint pode existir no backend mesmo não documentado. */
export async function listProjects(seasonId: string): Promise<Project[]> {
  const { data } = await api.get<Project[]>(`/seasons/${seasonId}/projects`)
  return data
}

export async function getProject(id: string): Promise<Project> {
  const { data } = await api.get<Project>(`/projects/${id}`)
  return data
}

export async function updateProject(
  id: string,
  payload: { name?: string; description?: string; coverImage?: string }
): Promise<Project> {
  const { data } = await api.patch<Project>(`/project-instances/${id}`, payload)
  return data
}

export async function publishProject(id: string): Promise<Project> {
  const { data } = await api.patch<Project>(`/project-instances/${id}/publish`)
  return data
}

export async function unpublishProject(id: string): Promise<Project> {
  const { data } = await api.patch<Project>(`/project-instances/${id}/unpublish`)
  return data
}

export async function deleteProjectInstance(id: string): Promise<void> {
  await api.delete(`/project-instances/${id}`)
}

export async function restoreProjectInstance(id: string): Promise<Project> {
  const { data } = await api.patch<Project>(`/project-instances/${id}/restore`)
  return data
}

export async function updateTrackScene(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/track-scenes/${id}`, payload)
  return data
}

export async function publishTrackScene(id: string) {
  const { data } = await api.patch(`/track-scenes/${id}/publish`)
  return data
}

export async function updateTrackMaterial(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/track-materials/${id}`, payload)
  return data
}

export async function updateStudyTrack(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/study-tracks/${id}`, payload)
  return data
}

export async function instantiatePressQuiz(payload: { templateId: string; trackSceneId: string; seasonId: string }) {
  const { data } = await api.post('/press-quizzes/from-template', payload)
  return data
}

export async function updatePressQuiz(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/press-quizzes/${id}`, payload)
  return data
}

export async function activatePressQuiz(id: string) {
  const { data } = await api.patch(`/press-quizzes/${id}/activate`)
  return data
}
