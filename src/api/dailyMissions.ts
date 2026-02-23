import { api } from './client'
import type { DailyMissionTemplate, DailyMissionQuiz, QuizQuestion, PaginatedResponse } from '@/types'

/** Only fields that can be updated on a daily mission quiz (PATCH). */
interface UpdateDailyMissionQuizPayload {
  questionsJson?: QuizQuestion[] | null
  maxAttemptsPerDay?: number
  allowRecoveryAttempt?: boolean
}

export async function listDailyMissionTemplates(courseId?: string) {
  const { data } = await api.get<DailyMissionTemplate[]>('/daily-mission-templates', { params: { courseId } })
  return data
}

export async function listDeletedDailyMissionTemplates(params: { page: number; limit: number }) {
  const { data } = await api.get<PaginatedResponse<DailyMissionTemplate>>('/daily-mission-templates/deleted', { params })
  return data
}

export async function restoreDailyMissionTemplate(id: string) {
  const { data } = await api.patch<DailyMissionTemplate>(`/daily-mission-templates/${id}/restore`)
  return data
}

export async function createDailyMissionTemplate(payload: { courseId: string; title: string; videoUrl?: string }) {
  const { data } = await api.post<DailyMissionTemplate>('/daily-mission-templates', payload)
  return data
}

export async function updateDailyMissionTemplate(id: string, payload: { title?: string; videoUrl?: string }) {
  const { data } = await api.patch<DailyMissionTemplate>(`/daily-mission-templates/${id}`, payload)
  return data
}

export async function deleteDailyMissionTemplate(id: string) {
  await api.delete(`/daily-mission-templates/${id}`)
}

export async function publishDailyMissionTemplate(id: string) {
  const { data } = await api.patch(`/daily-mission-templates/${id}/publish`)
  return data
}

// Quizzes
export async function createDailyMissionQuiz(missionId: string, payload: { questionsJson?: QuizQuestion[]; maxAttemptsPerDay?: number; allowRecoveryAttempt?: boolean }) {
  const { data } = await api.post<DailyMissionQuiz>(`/daily-mission-templates/${missionId}/quizzes`, payload)
  return data
}

export async function updateDailyMissionQuiz(id: string, payload: UpdateDailyMissionQuizPayload) {
  const { data } = await api.patch<DailyMissionQuiz>(`/daily-mission-quizzes/${id}`, payload)
  return data
}

export async function deleteDailyMissionQuiz(id: string) {
  await api.delete(`/daily-mission-quizzes/${id}`)
}

export async function listDailyMissionQuizzes(missionId: string) {
  const { data } = await api.get<DailyMissionQuiz[]>(`/daily-mission-templates/${missionId}/quizzes`)
  return data
}

export async function listDeletedDailyMissionQuizzes(params: { page: number; limit: number }) {
  const { data } = await api.get<PaginatedResponse<DailyMissionQuiz>>('/daily-mission-quizzes/deleted', { params })
  return data
}

export async function restoreDailyMissionQuiz(id: string) {
  const { data } = await api.patch<DailyMissionQuiz>(`/daily-mission-quizzes/${id}/restore`)
  return data
}
