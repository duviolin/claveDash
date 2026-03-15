import { api } from './client'
import type { DailyMissionInstance, DailyMissionStatus, PaginatedResponse } from '@/types'

interface ListDailyMissionInstancesParams {
  page: number
  limit: number
  seasonId?: string
  search?: string
}

export async function listDailyMissionInstancesPaginated(params: ListDailyMissionInstancesParams): Promise<PaginatedResponse<DailyMissionInstance>> {
  const { data } = await api.get<PaginatedResponse<DailyMissionInstance>>('/daily-missions/instances', {
    params,
  })
  return data
}

export async function createDailyMissionInstance(payload: {
  templateId: string
  studentId: string
  seasonId: string
  date: string
  status?: DailyMissionStatus
  attemptsCount?: number
}): Promise<DailyMissionInstance> {
  const { data } = await api.post<DailyMissionInstance>('/daily-missions/instances', payload)
  return data
}

export async function updateDailyMissionInstance(
  id: string,
  payload: { status?: DailyMissionStatus; attemptsCount?: number; date?: string }
): Promise<DailyMissionInstance> {
  const { data } = await api.patch<DailyMissionInstance>(`/daily-missions/instances/${id}`, payload)
  return data
}

export async function deleteDailyMissionInstance(id: string): Promise<void> {
  await api.delete(`/daily-missions/instances/${id}`)
}
