import { api } from './client'

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
