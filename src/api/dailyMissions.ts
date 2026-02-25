import { api } from './client'
import type { DailyMissionTemplate, DailyMissionQuiz, QuizQuestion, PaginatedResponse } from '@/types'

/** Only fields that can be updated on a daily mission quiz (PATCH). */
interface UpdateDailyMissionQuizPayload {
  questionsJson?: QuizQuestion[] | null
  maxAttemptsPerDay?: number
  allowRecoveryAttempt?: boolean
}

export async function listDailyMissionTemplates(courseIdOrSlug?: string) {
  const { data } = await api.get<DailyMissionTemplate[]>('/daily-mission-templates', { params: { courseId: courseIdOrSlug } })
  return data
}

export async function listDeletedDailyMissionTemplates(params: { page: number; limit: number }) {
  const { data } = await api.get<PaginatedResponse<DailyMissionTemplate>>('/daily-mission-templates/deleted', { params })
  return data
}

export async function restoreDailyMissionTemplate(idOrSlug: string) {
  const { data } = await api.patch<DailyMissionTemplate>(`/daily-mission-templates/${idOrSlug}/restore`)
  return data
}

export async function createDailyMissionTemplate(payload: { courseId: string; title: string; videoUrl?: string }) {
  const { data } = await api.post<DailyMissionTemplate>('/daily-mission-templates', payload)
  return data
}

export async function updateDailyMissionTemplate(idOrSlug: string, payload: { title?: string; videoUrl?: string }) {
  const { data } = await api.patch<DailyMissionTemplate>(`/daily-mission-templates/${idOrSlug}`, payload)
  return data
}

export async function deleteDailyMissionTemplate(idOrSlug: string) {
  await api.delete(`/daily-mission-templates/${idOrSlug}`)
}

export async function publishDailyMissionTemplate(idOrSlug: string) {
  const { data } = await api.patch(`/daily-mission-templates/${idOrSlug}/publish`)
  return data
}

// Quizzes
export async function createDailyMissionQuiz(missionIdOrSlug: string, payload: { questionsJson?: QuizQuestion[]; maxAttemptsPerDay?: number; allowRecoveryAttempt?: boolean }) {
  const { data } = await api.post<DailyMissionQuiz>(`/daily-mission-templates/${missionIdOrSlug}/quizzes`, payload)
  return data
}

export async function updateDailyMissionQuiz(id: string, payload: UpdateDailyMissionQuizPayload) {
  const { data } = await api.patch<DailyMissionQuiz>(`/daily-mission-quizzes/${id}`, payload)
  return data
}

export async function deleteDailyMissionQuiz(id: string) {
  await api.delete(`/daily-mission-quizzes/${id}`)
}

export async function listDailyMissionQuizzes(missionIdOrSlug: string) {
  const { data } = await api.get<DailyMissionQuiz[]>(`/daily-mission-templates/${missionIdOrSlug}/quizzes`)
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
