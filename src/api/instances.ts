import { api } from './client'
import type { Project } from '@/types'

export async function instantiateProject(payload: { templateId: string; classId: string; seasonId: string }) {
  const { data } = await api.post('/projects/from-template', payload)
  return data
}

export async function listProjects(seasonId: string) {
  const { data } = await api.get(`/seasons/${seasonId}/projects`)
  return data
}

export async function getProject(id: string) {
  const { data } = await api.get(`/projects/${id}`)
  return data
}

export async function updateProject(id: string, payload: { name?: string; description?: string; coverImage?: string }) {
  const { data } = await api.patch<Project>(`/projects/${id}`, payload)
  return data
}

export async function publishProject(id: string) {
  const { data } = await api.patch(`/projects/${id}/publish`)
  return data
}

export async function unpublishProject(id: string) {
  const { data } = await api.patch(`/projects/${id}/unpublish`)
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
