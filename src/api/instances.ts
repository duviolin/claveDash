import { api } from './client'
import type { Project } from '@/types'

export async function instantiateProject(payload: {
  templateId: string
  classId: string
  seasonId: string
}): Promise<Project> {
  const { data } = await api.post<Project>('/projects/from-template', payload)
  return data
}

/** Lista projetos da temporada. Endpoint pode existir no backend mesmo não documentado. */
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
  const { data } = await api.patch<Project>(`/projects/${id}`, payload)
  return data
}

export async function publishProject(id: string): Promise<Project> {
  const { data } = await api.patch<Project>(`/projects/${id}/publish`)
  return data
}

export async function unpublishProject(id: string): Promise<Project> {
  const { data } = await api.patch<Project>(`/projects/${id}/unpublish`)
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
