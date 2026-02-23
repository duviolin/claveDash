import { api } from './client'
import type { DomainEvent } from '@/types'

export interface DashboardStats {
  users: { total: number; students: number; teachers: number; directors: number; admins: number }
  schools: { total: number; active: number }
  courses: { total: number; active: number }
  seasons: { total: number; planned: number; active: number; closed: number }
  classes: { total: number; active: number }
  projectTemplates: { total: number }
  dailyMissionTemplates: { total: number; published: number }
  projects: { total: number; draft: number; active: number; completed: number }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/dashboard/stats')
  return data
}

export async function getRecentEvents(limit: number = 20): Promise<DomainEvent[]> {
  const { data } = await api.get<DomainEvent[]>('/dashboard/events/recent', { params: { limit } })
  return data
}
