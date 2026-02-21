import { api } from './client'
import type { DailyMissionTemplate, DailyMissionQuiz, QuizQuestion } from '@/types'

export async function listDailyMissionTemplates(courseId?: string) {
  const { data } = await api.get<DailyMissionTemplate[]>('/daily-mission-templates', { params: { courseId } })
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
  const { data } = await api.delete(`/daily-mission-templates/${id}`)
  return data
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

export async function updateDailyMissionQuiz(id: string, payload: Partial<DailyMissionQuiz>) {
  const { data } = await api.patch<DailyMissionQuiz>(`/daily-mission-quizzes/${id}`, payload)
  return data
}

export async function deleteDailyMissionQuiz(id: string) {
  const { data } = await api.delete(`/daily-mission-quizzes/${id}`)
  return data
}
