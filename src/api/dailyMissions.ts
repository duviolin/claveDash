import { api } from './client'
import type { DailyMissionTemplate, DailyMissionQuiz, QuizQuestion, PaginatedResponse } from '@/types'

interface ListPaginatedParams {
  page: number
  limit: number
  search?: string
}

/** Only fields that can be updated on a daily mission quiz (PATCH). */
interface UpdateDailyMissionQuizPayload {
  questionsJson?: QuizQuestion[] | null
  maxAttemptsPerDay?: number
  allowRecoveryAttempt?: boolean
}

interface BatchDailyMissionQuizResponse {
  data: Array<{
    dailyMissionId: string
    data: DailyMissionQuiz[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }>
}

export async function listDailyMissionTemplates(courseIdOrSlug?: string) {
  const { data } = await api.get<DailyMissionTemplate[]>('/daily-mission-templates', { params: { courseId: courseIdOrSlug } })
  return data
}

export async function listDailyMissionTemplatesPaginated(params: ListPaginatedParams & { courseIdOrSlug?: string }) {
  const { data } = await api.get<PaginatedResponse<DailyMissionTemplate>>('/daily-mission-templates', {
    params: {
      courseId: params.courseIdOrSlug,
      search: params.search,
      page: params.page,
      limit: params.limit,
    },
  })
  return data
}

export async function listDeletedDailyMissionTemplates(params: { page: number; limit: number; courseIdOrSlug?: string; search?: string }) {
  const { data } = await api.get<PaginatedResponse<DailyMissionTemplate>>('/daily-mission-templates/deleted', {
    params: {
      page: params.page,
      limit: params.limit,
      courseId: params.courseIdOrSlug,
      search: params.search,
    },
  })
  return data
}

export async function restoreDailyMissionTemplate(idOrSlug: string) {
  const { data } = await api.patch<DailyMissionTemplate>(`/daily-mission-templates/${idOrSlug}/restore`)
  return data
}

export async function createDailyMissionTemplate(payload: { courseId: string; title: string; videoKey?: string }) {
  const { data } = await api.post<DailyMissionTemplate>('/daily-mission-templates', payload)
  return data
}

export async function updateDailyMissionTemplate(idOrSlug: string, payload: { title?: string; videoKey?: string }) {
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

export async function unpublishDailyMissionTemplate(idOrSlug: string) {
  const { data } = await api.patch(`/daily-mission-templates/${idOrSlug}/unpublish`)
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

export async function listDailyMissionQuizzesPaginated(missionIdOrSlug: string, params: ListPaginatedParams) {
  const { data } = await api.get<PaginatedResponse<DailyMissionQuiz>>(`/daily-mission-templates/${missionIdOrSlug}/quizzes`, { params })
  return data
}

export async function listDailyMissionQuizzesBatch(params: { dailyMissionIds: string[]; page: number; limit: number }) {
  const { data } = await api.get<BatchDailyMissionQuizResponse>('/daily-mission-templates/quizzes/batch', {
    params: {
      dailyMissionIds: params.dailyMissionIds.join(','),
      page: params.page,
      limit: params.limit,
    },
  })
  return data.data
}

export async function listDeletedDailyMissionQuizzes(params: { page: number; limit: number; dailyMissionId?: string }) {
  const { data } = await api.get<PaginatedResponse<DailyMissionQuiz>>('/daily-mission-quizzes/deleted', { params })
  return data
}

export async function restoreDailyMissionQuiz(id: string) {
  const { data } = await api.patch<DailyMissionQuiz>(`/daily-mission-quizzes/${id}/restore`)
  return data
}
